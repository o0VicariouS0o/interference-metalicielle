# Génération géographique NET

## Installation unique

Depuis la racine du projet, ouvre PowerShell et exécute :

```powershell
py -m pip install openpyxl
```

## Premier test

Le test limite le géocodage à 10 nouveaux lieux :

```powershell
py scripts/build-net-geography.py --limit 10
```

## Génération complète

```powershell
py scripts/build-net-geography.py
```

## Forcer une nouvelle recherche GeoNames

```powershell
py scripts/build-net-geography.py --refresh
```

## Fichier Excel introuvable

Indique son chemin explicitement :

```powershell
py scripts/build-net-geography.py --excel "chemin\vers\Metaliciel_Base_Maitre_V4.xlsx"
```

## Fichiers produits

- `app/data/net/geography.json` : lieux validés automatiquement.
- `app/data/net/geography-review.json` : correspondances à vérifier.
- `app/data/net/geography-unmatched.json` : lieux non trouvés.

Les lieux déjà enregistrés sont conservés lors des exécutions suivantes.
Seuls les nouveaux lieux sont envoyés à GeoNames.
