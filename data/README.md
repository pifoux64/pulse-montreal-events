# Quartiers de Montréal

Ce dossier peut contenir un fichier `neighborhoods.geojson` décrivant les limites des quartiers ou arrondissements de Montréal (GeoJSON Polygon ou MultiPolygon).

Le script `npm run enrich:locations` utilise ce fichier pour attribuer automatiquement un `neighborhood` aux événements dont les coordonnées sont connues. Vous pouvez télécharger une source publique (ex. portail Données Ouvertes Montréal) et la placer ici.
