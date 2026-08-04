# PEA Portfolio Manager

## Exposition pays / secteur (scrapper justETF)

Les cartes « Exposition par pays » et « Exposition par secteur », ainsi que le détail
affiché au survol de la roue « Répartition du Patrimoine PEA », sont calculés à partir de
[src/data/etfExposures.json](src/data/etfExposures.json). Ce fichier est produit hors ligne
par [src/scrappers/script.py](src/scrappers/script.py), qui lit les fiches justETF.

```bash
python3 -m venv .venv
.venv/bin/pip install -r src/scrappers/requirements.txt

# ajouter / mettre à jour des ETF (l'ISIN est celui saisi dans l'app)
.venv/bin/python src/scrappers/script.py LU1681043599 FR0011550185

# rafraîchir tout ce qui est déjà dans le JSON
.venv/bin/python src/scrappers/script.py --refresh

# repartir des ISIN d'un export de l'application
.venv/bin/python src/scrappers/script.py --from-export mon-export.json
```

Les ETF à réplication synthétique (la plupart des ETF éligibles au PEA) n'exposent pas leur
composition sur justETF : le script retient alors automatiquement un ETF physique répliquant
le même indice, et l'app signale que l'exposition est estimée. Quand l'indice n'existe qu'en
version swap (indices « maison » de certains ETF PEA), le fonds de substitution se déclare à
la main dans [src/scrappers/proxies.json](src/scrappers/proxies.json).

Un ETF détenu mais absent du JSON n'est pas ignoré : sa valorisation apparaît en « Non
couvert » pour ne pas fausser les pourcentages.

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
