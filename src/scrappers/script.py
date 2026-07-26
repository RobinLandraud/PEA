"""
Exposition pays / secteur / top holdings d'un ETF, via justETF.

Usage :
    python3 etf_exposure.py FR001400U5Q4
    python3 etf_exposure.py IE000BI8OT95

Si l'ETF est à réplication synthétique (swap) et n'a donc pas de section
pays/secteur sur justETF, le script cherche automatiquement un ETF physique
qui réplique le même indice et affiche son exposition à la place (elle est
censée être identique en exposition économique).
"""

import sys
import justetf_scraping as j


def print_overview(overview: dict) -> None:
    print("Nom      :", overview.get("name"))
    print("TER      :", overview.get("ter"), "%")
    print("Taille   :", overview.get("fund_size_eur"), "M EUR")
    print("Indice   :", overview.get("index"))
    print("Réplication:", overview.get("replication"))
    print()

    print("--- Répartition par pays ---")
    for c in overview.get("countries", []):
        print(f"  {c['name']:<25} {c['percentage']}%")
    print()

    print("--- Répartition par secteur ---")
    for s in overview.get("sectors", []):
        print(f"  {s['name']:<25} {s['percentage']}%")
    print()

    print("--- Top holdings ---")
    for h in overview.get("top_holdings", []):
        print(f"  {h['name']:<25} ({h.get('isin')}) {h['percentage']}%")


def find_physical_equivalent(isin: str, index: str, prefer_provider: str = None):
    """
    Cherche un ETF à réplication physique sur le même indice qu'un ETF
    synthétique (swap), en utilisant l'endpoint de recherche justETF.

    Si `prefer_provider` est fourni (ex: "Amundi"), on essaie d'abord de
    rester chez le même émetteur ; sinon on prend le plus gros fonds toutes
    marques confondues.
    """
    candidates = j.overview.load_overview(index=index)

    if candidates.empty:
        print("Aucun ETF trouvé sur cet indice via justETF.")
        return None

    # On exclut sur le mot-clé "swap" plutôt que de deviner le libellé exact
    # du "physique" (qui varie selon langue/région du site).
    physical = candidates[
        ~candidates["replication"].str.contains("swap", case=False, na=False)
    ]

    if physical.empty:
        print("Aucun ETF physique trouvé pour cet indice (que du swap).")
        print("Libellés de réplication disponibles :", candidates["replication"].unique())
        return None

    physical = physical.sort_values("size", ascending=False)

    if prefer_provider:
        same_provider = physical[
            physical["name"].str.contains(prefer_provider, case=False, na=False)
        ]
        if not same_provider.empty:
            best = same_provider.iloc[0]
            best_isin = best.name
            print(f"→ Équivalent physique (même émetteur) trouvé : {best['name']} ({best_isin})")
            return best_isin
        print(f"Aucun ETF physique de {prefer_provider} sur cet indice, on prend le plus gros toutes marques confondues.")

    # On prend le plus gros fonds (généralement le plus fiable/liquide)
    best = physical.iloc[0]
    best_isin = best.name  # l'ISIN est l'index du DataFrame, pas une colonne
    print(f"→ Équivalent physique trouvé : {best['name']} ({best_isin})")
    return best_isin


def get_exposure(isin: str) -> None:
    overview = j.get_etf_overview(isin, include_gettex=False)

    has_data = bool(overview.get("countries")) or bool(overview.get("sectors"))
    if has_data:
        print_overview(overview)
        return

    index = overview.get("index")
    print()
    print(f"⚠ Pas de données pays/secteur pour cet ETF (réplication : {overview.get('replication')}).")

    if not index:
        print("Impossible de chercher un équivalent : indice inconnu.")
        return

    print(f"Recherche d'un équivalent physique sur l'indice « {index} »...")

    # On déduit l'émetteur à partir du nom du fonds de départ (ex: "Amundi")
    provider = overview.get("name", "").split()[0] if overview.get("name") else None
    physical_isin = find_physical_equivalent(isin, index, prefer_provider=provider)

    if physical_isin:
        print()
        print(f"--- Exposition pays/secteur (via l'équivalent physique {physical_isin}) ---")
        physical_overview = j.get_etf_overview(physical_isin, include_gettex=False)
        print_overview(physical_overview)


if __name__ == "__main__":
    isin_arg = sys.argv[1] if len(sys.argv) > 1 else "IE000BI8OT95"
    get_exposure(isin_arg)