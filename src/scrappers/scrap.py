"""
Récupère l'exposition par pays / secteur / top holdings d'un ETF via justETF.
Installation : pip install git+https://github.com/druzsan/justetf-scraping.git

À exécuter en local (pas dans un environnement sandboxé qui bloque justetf.com).
"""

import justetf_scraping as j

ISIN = "IE000BI8OT95"  # Amundi Core MSCI World UCITS ETF Acc, les ISIN swap ne fonctionnent pas

overview = j.get_etf_overview(ISIN, include_gettex=False)

print("Nom      :", overview.get("name"))
print("TER      :", overview.get("ter"), "%")
print("Taille   :", overview.get("fund_size_eur"), "M EUR")
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