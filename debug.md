# Debug - Ecran blanc sur PC fixe

Le site fonctionne sur le PC de voyage mais affiche un ecran blanc sur le PC fixe (tous navigateurs).

## Etapes de diagnostic

### 1. Console du navigateur
- Ouvrir DevTools : `F12` > onglet **Console**
- Chercher les erreurs rouges
- Copier le message exact

### 2. Onglet Network
- F12 > onglet **Network** > recharger la page
- Filtrer par **JS** : verifier que les fichiers `.js` se chargent (pas de 404, pas de requete bloquee)
- Filtrer par **XHR** : verifier que les appels `/api/` passent

### 3. Hard refresh / navigation privee
- `Ctrl+Shift+R` pour forcer le rechargement sans cache
- Tester en navigation privee (`Ctrl+Shift+N` sur Chrome)

### 4. Version du navigateur
- Verifier la version : `chrome://version` ou `about:` dans la barre d'adresse
- Nuxt 4 utilise du JS moderne (optional chaining `?.`, nullish coalescing `??`, etc.)
- Minimum recommande : Chrome 80+, Firefox 72+, Edge 80+

### 5. Extensions
- Desactiver temporairement toutes les extensions (surtout ad blockers, uBlock, etc.)
- Certaines extensions bloquent les requetes vers `/api/`

### 6. DNS / Reseau
- Verifier que `entreprise.legeai-editions.com` est accessible : ouvrir l'URL dans le navigateur
- Tester `ping entreprise.legeai-editions.com` dans un terminal
- Verifier qu'il n'y a pas de proxy ou VPN actif

### 7. Si rien ne marche
- Ouvrir `https://entreprise.legeai-editions.com` > F12 > Console > copier TOUTE la sortie
- Partager le resultat pour diagnostic
