"""
Exposition pays / secteur / top holdings d'un ETF, via justETF.

Le script alimente le jeu de données utilisé par l'application React
(`src/data/etfExposures.json`) : pour chaque ISIN, il récupère sur justETF la
répartition par pays, par secteur et les principales lignes du fonds.

Usage :
    python script.py IE00B4L5Y983                  # scrape + merge dans le JSON
    python script.py LU1681043599 FR0011550185     # plusieurs ISIN d'un coup
    python script.py --refresh                     # re-scrape tous les ISIN déjà connus
    python script.py --from-export export.json     # ISIN issus d'un export de l'app
    python script.py IE00B4L5Y983 --print          # affichage lisible, sans écriture
    python script.py IE00B4L5Y983 --output -       # JSON sur la sortie standard

Si l'ETF est à réplication synthétique (swap) et n'a donc pas de section
pays/secteur sur justETF, le script cherche automatiquement un ETF physique
qui réplique le même indice et utilise son exposition à la place (elle est
censée être identique en exposition économique). L'ETF utilisé comme proxy est
alors mémorisé dans le JSON (`proxyIsin` / `proxyName`) pour que l'interface
puisse signaler que la donnée est estimée.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.justetf.com"
PROFILE_URL = BASE_URL + "/fr/etf-profile.html"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# src/scrappers/script.py -> src/data/etfExposures.json
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "etfExposures.json"
# Proxies choisis à la main pour les ETF dont l'indice n'existe qu'en version swap.
PROXIES_FILE = Path(__file__).resolve().parent / "proxies.json"

ISIN_RE = re.compile(r"^[A-Z]{2}[A-Z0-9]{9}\d$")
SWAP_RE = re.compile(r"swap|synth", re.IGNORECASE)


class ScrapeError(RuntimeError):
    """Erreur fonctionnelle (ISIN inconnu, page illisible, ...)."""


# --------------------------------------------------------------------------- #
# Helpers de parsing
# --------------------------------------------------------------------------- #


def parse_number(raw: str | None) -> float | None:
    """Convertit un nombre au format français ("1 234,56 %") en float."""
    if not raw:
        return None
    cleaned = (
        raw.replace(" ", "")
        .replace(" ", "")
        .replace(" ", "")
        .replace("%", "")
        .replace("EUR", "")
        .replace("€", "")
        .replace(",", ".")
    )
    match = re.search(r"-?\d+(?:\.\d+)?", cleaned)
    return float(match.group()) if match else None


def text_of(soup: BeautifulSoup, testid: str) -> str | None:
    node = soup.find(attrs={"data-testid": testid})
    if node is None:
        return None
    value = node.get_text(" ", strip=True)
    return value or None


def basics_value(soup: BeautifulSoup, key: str) -> str | None:
    """Valeur d'une ligne du tableau « Données de base » (dernière cellule)."""
    row = soup.find(attrs={"data-testid": f"etf-basics_row_{key}"})
    if row is None:
        return None
    cells = row.find_all("td")
    if not cells:
        return None
    value = cells[-1].get_text(" ", strip=True)
    return value or None


def parse_reference_date(soup: BeautifulSoup) -> str | None:
    """Date d'arrêté de la composition, sans le libellé « État : »."""
    raw = text_of(soup, "tl_etf-holdings_reference-date")
    if not raw:
        return None
    match = re.search(r"\d{2}[/.]\d{2}[/.]\d{4}", raw)
    return match.group().replace(".", "/") if match else raw


def parse_rows(scope: BeautifulSoup, kind: str) -> list[dict[str, Any]]:
    """
    Lit une table de composition (`countries`, `sectors`, `top-holdings`).

    Le libellé et le pourcentage portent des `data-testid` stables sur justETF,
    ce qui évite de dépendre de la structure exacte du tableau.
    """
    name_key = "link_name" if kind == "top-holdings" else "value_name"
    rows: list[dict[str, Any]] = []

    for tr in scope.find_all(attrs={"data-testid": f"etf-holdings_{kind}_row"}):
        name = tr.find(attrs={"data-testid": f"tl_etf-holdings_{kind}_{name_key}"})
        percent = tr.find(attrs={"data-testid": f"tl_etf-holdings_{kind}_value_percentage"})
        if name is None or percent is None:
            continue
        value = parse_number(percent.get_text(strip=True))
        if value is None:
            continue
        rows.append({"name": name.get_text(" ", strip=True), "percent": round(value, 4)})

    return rows


def find_ajax_url(html: str, component_id: str) -> str | None:
    """
    Retrouve l'URL de callback Wicket associée au lien « Afficher plus ».

    justETF ne rend que les 5 premières lignes de chaque table ; le reste est
    chargé en AJAX par un composant Wicket dont l'URL est inline dans la page.
    """
    pattern = re.compile(
        r'Wicket\.Ajax\.ajax\(\{"u":"([^"]+)","c":"%s"' % re.escape(component_id)
    )
    match = pattern.search(html)
    if not match:
        return None
    return BASE_URL + match.group(1).replace("&amp;", "&")


# --------------------------------------------------------------------------- #
# Scraping
# --------------------------------------------------------------------------- #


class JustETFClient:
    def __init__(self, delay: float = 1.0) -> None:
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "fr-FR,fr;q=0.9"})
        self.delay = delay
        self._last_call = 0.0

    def _throttle(self) -> None:
        elapsed = time.monotonic() - self._last_call
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self._last_call = time.monotonic()

    def get_profile(self, isin: str) -> tuple[BeautifulSoup, str]:
        self._throttle()
        response = self.session.get(PROFILE_URL, params={"isin": isin}, timeout=30)
        if response.status_code == 404:
            raise ScrapeError(f"ISIN inconnu sur justETF : {isin}")
        response.raise_for_status()
        html = response.text
        return BeautifulSoup(html, "lxml"), html

    def load_full_table(self, isin: str, html: str, kind: str) -> BeautifulSoup | None:
        """Déplie une table via le callback AJAX du lien « Afficher plus »."""
        soup = BeautifulSoup(html, "lxml")
        link = soup.find(attrs={"data-testid": f"etf-holdings_{kind}_load-more_link"})
        if link is None or not link.get("id"):
            return None

        url = find_ajax_url(html, link["id"])
        if url is None:
            return None

        self._throttle()
        response = self.session.get(
            url,
            headers={
                "Wicket-Ajax": "true",
                "Wicket-Ajax-BaseURL": f"fr/etf-profile.html?isin={isin}",
                "X-Requested-With": "XMLHttpRequest",
            },
            timeout=30,
        )
        if not response.ok:
            return None

        # La réponse est un <ajax-response> dont les composants sont en CDATA.
        fragments = re.findall(r"<!\[CDATA\[(.*?)\]\]>", response.text, re.DOTALL)
        if not fragments:
            return None
        return BeautifulSoup("".join(fragments), "lxml")


def parse_composition(client: JustETFClient, isin: str, html: str, soup: BeautifulSoup) -> dict:
    """Pays / secteurs / top holdings, en dépliant les tables tronquées."""
    composition: dict[str, list[dict[str, Any]]] = {}

    for kind, key in (
        ("countries", "countries"),
        ("sectors", "sectors"),
        ("top-holdings", "topHoldings"),
    ):
        rows = parse_rows(soup, kind)
        if rows and kind != "top-holdings":
            expanded = client.load_full_table(isin, html, kind)
            if expanded is not None:
                full_rows = parse_rows(expanded, kind)
                if len(full_rows) > len(rows):
                    rows = full_rows
        composition[key] = rows

    return composition


def parse_related_etfs(soup: BeautifulSoup) -> list[dict[str, Any]]:
    """ETF listés par justETF comme répliquant le même indice."""
    related: list[dict[str, Any]] = []

    for tr in soup.find_all(attrs={"data-testid": re.compile(r"related-etf-row-")}):
        testid = tr["data-testid"]
        isin = testid.rsplit("-", 1)[-1]
        if not ISIN_RE.match(isin):
            continue
        cells = tr.find_all("td")
        link = tr.find("a")
        related.append(
            {
                "isin": isin,
                "name": (link.get("title") or link.get_text(" ", strip=True)) if link else isin,
                "size": parse_number(cells[1].get_text(strip=True)) if len(cells) > 1 else None,
                "replication": cells[4].get_text(" ", strip=True) if len(cells) > 4 else "",
            }
        )

    return related


def pick_physical_equivalent(
    related: list[dict[str, Any]], prefer_provider: str | None = None
) -> dict[str, Any] | None:
    """
    Choisit un ETF physique sur le même indice pour remplacer un ETF swap.

    On exclut sur le mot-clé « swap » plutôt que de deviner le libellé exact du
    « physique » (qui varie selon la langue du site), puis on prend le plus gros
    fonds — en privilégiant le même émetteur s'il en propose un.
    """
    physical = [etf for etf in related if not SWAP_RE.search(etf["replication"] or "")]
    if not physical:
        return None

    physical.sort(key=lambda etf: etf["size"] or 0, reverse=True)

    if prefer_provider:
        same_provider = [
            etf for etf in physical if prefer_provider.lower() in (etf["name"] or "").lower()
        ]
        if same_provider:
            return same_provider[0]

    return physical[0]


def load_manual_proxies() -> dict[str, str]:
    """
    Table ISIN -> ISIN de substitution, éditable à la main.

    Certains ETF PEA répliquent un indice « maison » (ex. MSCI EM ex-Egypt ESG
    Broad CTB Select) qui n'existe qu'en version swap : justETF ne propose alors
    aucun équivalent physique et il faut désigner soi-même un fonds comparable.
    """
    if not PROXIES_FILE.exists():
        return {}
    with PROXIES_FILE.open(encoding="utf-8") as handle:
        data = json.load(handle)
    return {
        key.upper(): value["isin"].upper() if isinstance(value, dict) else str(value).upper()
        for key, value in data.items()
        if not key.startswith("_")
    }


def scrape_etf(
    client: JustETFClient,
    isin: str,
    allow_proxy: bool = True,
    manual_proxies: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Retourne l'exposition d'un ETF, via un proxy physique si nécessaire."""
    isin = isin.strip().upper()
    soup, html = client.get_profile(isin)

    name = text_of(soup, "etf-profile-header_etf-name")
    if not name:
        raise ScrapeError(f"Page justETF illisible pour {isin} (fiche introuvable ?)")

    record: dict[str, Any] = {
        "isin": isin,
        "name": name,
        "index": text_of(soup, "tl_etf-basics_value_index-name") or basics_value(soup, "index-name"),
        "replication": text_of(soup, "etf-profile-header_replication-value")
        or basics_value(soup, "replication"),
        "ter": parse_number(text_of(soup, "etf-profile-header_ter-value")),
        "fundSizeMEur": parse_number(basics_value(soup, "fund-size")),
        "referenceDate": parse_reference_date(soup),
        "url": f"{PROFILE_URL}?isin={isin}",
        "countries": [],
        "sectors": [],
        "topHoldings": [],
    }

    composition = parse_composition(client, isin, html, soup)
    if composition["countries"] or composition["sectors"]:
        record.update(composition)
        return record

    # ETF synthétique : justETF n'affiche pas la composition, on passe par un
    # équivalent physique sur le même indice.
    if not allow_proxy:
        return record

    provider = name.split()[0] if name else None
    proxy = pick_physical_equivalent(parse_related_etfs(soup), prefer_provider=provider)
    manual_isin = (manual_proxies or {}).get(isin)
    if proxy is None and manual_isin:
        proxy = {"isin": manual_isin, "name": None}
    if proxy is None:
        return record

    proxy_soup, proxy_html = client.get_profile(proxy["isin"])
    proxy_composition = parse_composition(client, proxy["isin"], proxy_html, proxy_soup)
    if not (proxy_composition["countries"] or proxy_composition["sectors"]):
        return record

    record.update(proxy_composition)
    record["proxyIsin"] = proxy["isin"]
    record["proxyName"] = proxy["name"] or text_of(proxy_soup, "etf-profile-header_etf-name")
    record["proxySource"] = "manual" if proxy["isin"] == manual_isin else "auto"
    record["referenceDate"] = parse_reference_date(proxy_soup)
    return record


# --------------------------------------------------------------------------- #
# Sorties
# --------------------------------------------------------------------------- #


def print_record(record: dict[str, Any]) -> None:
    print("Nom        :", record.get("name"))
    print("TER        :", record.get("ter"), "%")
    print("Taille     :", record.get("fundSizeMEur"), "M EUR")
    print("Indice     :", record.get("index"))
    print("Réplication:", record.get("replication"))
    if record.get("proxyIsin"):
        print(f"Exposition estimée via {record['proxyName']} ({record['proxyIsin']})")
    print()

    for title, key in (
        ("Répartition par pays", "countries"),
        ("Répartition par secteur", "sectors"),
        ("Top holdings", "topHoldings"),
    ):
        rows = record.get(key) or []
        print(f"--- {title} ---")
        if not rows:
            print("  (aucune donnée)")
        for row in rows:
            print(f"  {row['name']:<32} {row['percent']:>6.2f} %")
        print()


def load_dataset(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"generatedAt": None, "source": BASE_URL, "etfs": {}}
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    data.setdefault("etfs", {})
    return data


def write_dataset(path: Path, dataset: dict[str, Any]) -> None:
    dataset["source"] = BASE_URL
    dataset["generatedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    dataset["etfs"] = dict(sorted(dataset["etfs"].items()))
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(dataset, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def isins_from_export(path: Path) -> list[str]:
    """Extrait les ISIN d'un export JSON de l'application."""
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    return [etf["isin"] for etf in data.get("etfs", []) if etf.get("isin")]


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("isins", nargs="*", help="ISIN des ETF à scraper")
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Fichier JSON à mettre à jour ('-' pour la sortie standard)",
    )
    parser.add_argument(
        "--refresh", action="store_true", help="Re-scrape tous les ISIN déjà présents dans le JSON"
    )
    parser.add_argument(
        "--from-export", metavar="FICHIER", help="Lit les ISIN depuis un export JSON de l'app"
    )
    parser.add_argument("--print", action="store_true", help="Affichage lisible, sans écriture")
    parser.add_argument(
        "--no-proxy",
        action="store_true",
        help="N'utilise pas d'ETF physique de substitution pour les ETF swap",
    )
    parser.add_argument(
        "--delay", type=float, default=1.0, help="Délai minimum entre deux requêtes (secondes)"
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    to_stdout = args.output == "-"
    output_path = None if to_stdout else Path(args.output)
    dataset = load_dataset(output_path) if output_path else {"etfs": {}}

    isins = [isin.strip().upper() for isin in args.isins]
    if args.from_export:
        isins += [isin.upper() for isin in isins_from_export(Path(args.from_export))]
    if args.refresh:
        isins += list(dataset["etfs"].keys())

    # dédoublonnage en conservant l'ordre
    isins = list(dict.fromkeys(isins))

    if not isins:
        print("Aucun ISIN à traiter (voir --help).", file=sys.stderr)
        return 1

    invalid = [isin for isin in isins if not ISIN_RE.match(isin)]
    if invalid:
        print(f"ISIN invalide(s) : {', '.join(invalid)}", file=sys.stderr)
        return 1

    client = JustETFClient(delay=args.delay)
    manual_proxies = load_manual_proxies()
    failures = 0

    for isin in isins:
        try:
            record = scrape_etf(
                client, isin, allow_proxy=not args.no_proxy, manual_proxies=manual_proxies
            )
        except (ScrapeError, requests.RequestException) as error:
            print(f"✗ {isin} : {error}", file=sys.stderr)
            failures += 1
            continue

        if args.print:
            print_record(record)
            continue

        dataset["etfs"][isin] = record
        origin = f" via {record['proxyIsin']}" if record.get("proxyIsin") else ""
        if record["countries"] or record["sectors"]:
            print(
                f"✓ {isin} {record['name']} — "
                f"{len(record['countries'])} pays / {len(record['sectors'])} secteurs{origin}"
            )
        else:
            print(f"⚠ {isin} {record['name']} — aucune donnée pays/secteur trouvée")

    if not args.print:
        if to_stdout:
            json.dump(dataset, sys.stdout, ensure_ascii=False, indent=2)
            sys.stdout.write("\n")
        else:
            write_dataset(output_path, dataset)
            print(f"→ {output_path} mis à jour ({len(dataset['etfs'])} ETF)")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
