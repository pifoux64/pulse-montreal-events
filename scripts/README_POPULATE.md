# Scripts de remplissage des salles et organisateurs

Ces scripts permettent de créer automatiquement toutes les salles et organisateurs depuis les événements existants dans la base de données.

## Scripts disponibles

### 1. `populate-venues-from-events.ts`
Crée toutes les salles (venues) depuis les événements qui n'ont pas encore de salle associée.

**Ce que fait le script :**
- Extrait tous les lieux uniques depuis les EventFeature des événements
- Crée les venues correspondantes avec géocodage automatique
- Génère des slugs uniques pour chaque salle
- Met à jour les événements pour les relier aux venues créées

**Usage :**
```bash
npx tsx scripts/populate-venues-from-events.ts
```

### 2. `populate-organizers-from-events.ts`
Crée tous les organisateurs depuis les événements qui n'ont pas encore d'organisateur associé.

**Ce que fait le script :**
- Extrait tous les organisateurs uniques depuis les EventFeature des événements
- Si l'organisateur n'est pas trouvé, utilise le nom de la source (ex: "Ticketmaster")
- Crée des utilisateurs système pour chaque organisateur
- Crée les organisateurs correspondants
- Met à jour les événements pour les relier aux organisateurs créés

**Usage :**
```bash
npx tsx scripts/populate-organizers-from-events.ts
```

### 3. `populate-all.ts`
Script principal qui exécute les deux scripts dans l'ordre.

**Usage :**
```bash
npx tsx scripts/populate-all.ts
```

## Notes importantes

- Les scripts sont idempotents : ils peuvent être exécutés plusieurs fois sans créer de doublons
- Les salles et organisateurs déjà existants sont ignorés
- Le géocodage utilise l'API Nominatim (OpenStreetMap) avec un délai de 1 seconde entre chaque requête pour respecter les limites
- Les organisateurs créés automatiquement ne sont pas vérifiés (`verified: false`)
- Les utilisateurs système créés pour les organisateurs ont des emails au format `{nom-organisateur}@system.pulse-mtl.ca`

## Résolution des problèmes

Si un script échoue :
1. Vérifiez que la base de données est accessible
2. Vérifiez que les variables d'environnement sont correctement configurées
3. Consultez les logs pour identifier les erreurs spécifiques
4. Les scripts continuent même en cas d'erreur partielle (certaines salles/organisateurs peuvent être créés même si d'autres échouent)
