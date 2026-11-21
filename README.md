# Mission Inférences (version Vercel)

Défis de lecture (inférences) pour les cycles 2 et 3. Les élèves lisent un texte, répondent à une ou plusieurs questions et sélectionnent les indices qui justifient leur réponse. L'IA Albert vérifie les réponses ; l'ERUN suit les résultats de tous les groupes depuis son poste ; des enseignants peuvent consulter le suivi de leur école en lecture seule.

## Structure
- `public/` : le site (`index.html`, `app.js` côté élèves, `admin.js` espace administrateur, `styles.css`).
- `api/` : points d'entrée Vercel (`defis`, `acces`, `verifier`, `aide`, `admin`, `enseignant`, `sante`).
- `server/` : le code serveur (`functions/` et `functions/lib/`), dont `seed.json` (les 15 défis de départ, jamais envoyés au navigateur avec leurs réponses).
- `package.json` (dépendance `@upstash/redis`) et `vercel.json`.

## Mise en place sur Vercel
1. **GitHub** : créer un dépôt et y mettre **le contenu** de ce dossier à la racine (`public/`, `api/`, `server/`, `package.json`, `vercel.json`…). Ne jamais publier de fichier `.env`.
2. **Vercel** : *Add New → Project → Import* le dépôt. Framework : « Other » (aucune commande de build). Lancer le déploiement.
3. **Base de données** : dans le projet, onglet *Storage* → créer une base **Upstash for Redis** (Marketplace), offre gratuite, et la connecter au projet pour tous les environnements. Vercel ajoute seul `KV_REST_API_URL` et `KV_REST_API_TOKEN`.
4. **Variables** (*Settings → Environment Variables*) :
   - `ALBERT_API_KEY` : clé Albert (obligatoire, la marquer « Sensitive » si proposé) ;
   - `ADMIN_PASSWORD` : mot de passe de l'espace administrateur, long et unique (obligatoire) ;
   - `ALBERT_MODEL` : identifiant d'un modèle `text-generation`, non « raisonnement » ; défaut `albert-large` ;
   - `ALLOWED_ORIGIN` : adresse du site, sans `/` final (facultatif).
5. **Redéployer** (*Deployments → Redeploy*, ou un nouveau commit) : les variables ne sont prises en compte qu'au déploiement suivant.
6. Ouvrir `https://VOTRE-SITE.vercel.app/api/sante?albert=1` : la page affiche ✅ ou ❌ pour les variables, le stockage, les défis, la clé Albert et le modèle (avec la liste des modèles utilisables). Elle ne révèle aucun secret. Journaux détaillés : *Logs* du projet Vercel.
7. Ouvrir le site, « Espace administrateur » (mot de passe), puis :
   - onglet **Codes** : « Générer les codes manquants », « Enregistrer », « Imprimer la liste » ;
   - onglet **Réglages** : signature, limites, conservation du suivi ;
   - onglet **Enseignants** : comptes en lecture seule par école.

Test local : `npm i -g vercel`, `vercel link`, `vercel env pull .env.local`, puis `vercel dev`.

## Espace administrateur
- **Suivi des groupes** : résultats par groupe, détail par défi et par question, filtres (niveau, école, groupe, défi, période), graphiques, « Questions à retravailler » avec diagnostic et suggestion de reformulation par l'IA, exports CSV, actualisation, remise à zéro.
- **Défis** : création, modification, plusieurs questions par défi, duplication, réordonnancement (l'ordre fixe le déblocage). Dans l'éditeur, « Tester le jugement de l'IA » sur la version affichée (rien n'est ajouté au suivi).
- **Codes** : codes d'accès (remis par l'ERUN) et de validation, générés au hasard ou saisis, liste imprimable.
- **Enseignants** : accès en lecture seule limité à une ou plusieurs écoles (nom + école(s) + code). L'enseignant coche « Je suis enseignant·e » et saisit son code ; le serveur ne lui renvoie que le suivi de ses écoles.
- **Réglages** : signature du créateur (texte, affichée ou masquée), lecture à voix haute, dictée, limites d'usage de l'IA, conservation du suivi (purge automatique).

## Côté élèves
- Code de groupe au format `niveau-école` (exemple : `CE2-Victor Hugo`). Aucun nom d'élève.
- Texte et questions remis seulement après le code d'accès ; réponses de référence, indices attendus et aides restent sur le serveur (aides remises une à une).
- Lecture à voix haute, dictée (si activée), confort de lecture (bouton « Aa »), reprise de la réponse en cours.

## Intégration dans une autre page (iframe : ENT, e-primo, site d'école…)
Code à coller dans un bloc « HTML » de la page (remplacer l'adresse par celle de votre site) :

```html
<iframe src="https://VOTRE-SITE.vercel.app/" title="Mission Inférences" width="100%" height="1100" style="border:0;" loading="lazy"></iframe>
```

- **Présentation compacte automatique** : dans un cadre, l'application réduit l'en-tête, la bannière et les marges pour tenir dans une colonne étroite. `?embed=1` à la fin de l'adresse force ce mode, `?embed=0` le désactive. Plus la zone de l'ENT est large, plus l'affichage est confortable.
- **Hauteur** : la page défile à l'intérieur du cadre ; 1000 à 1200 pixels conviennent sur ordinateur. Un script de redimensionnement automatique ne peut pas être ajouté dans un ENT, qui retire le JavaScript.
- **Dictée** : si elle est activée dans les Réglages, ajouter `allow="microphone"` dans la balise.
- **Fenêtres de dialogue** : l'application utilise ses propres fenêtres (code d'accès, confirmations), car les navigateurs bloquent `alert`, `confirm` et `prompt` dans une page intégrée depuis un autre site.
- **Mémoire de l'appareil** : dans un cadre, certains navigateurs isolent ou refusent le stockage local. L'application fonctionne quand même, mais le code de groupe et la reprise de la réponse en cours peuvent être redemandés après un rechargement. Les résultats, eux, sont toujours enregistrés sur le serveur.
- **Espace administrateur** : à ouvrir directement sur l'adresse du site plutôt que dans le cadre.
- **Restreindre les sites autorisés à intégrer l'application** (facultatif, recommandé une fois l'adresse de l'ENT connue) : ajouter dans `vercel.json`
  ```json
  "headers": [{ "source": "/(.*)", "headers": [{ "key": "Content-Security-Policy", "value": "frame-ancestors 'self' https://adresse-de-l-ent.fr" }] }]
  ```
- **Si l'ENT refuse l'iframe** : les ENT filtrent souvent le code intégré. Chercher dans l'éditeur une option « code HTML » ou « intégrer » ; sinon demander aux administrateurs de l'ENT d'autoriser l'adresse du site, ou placer un simple lien qui s'ouvre dans un nouvel onglet.

## Sécurité et protection des données
- La clé Albert, les codes et les mots de passe ne sont jamais dans le code public.
- Le jugement s'appuie sur des données qui viennent du serveur ; le code de validation n'est remis qu'à la réussite de la dernière question.
- Limites : 30 erreurs de code d'accès par 10 minutes et par connexion ; 10 erreurs de mot de passe administrateur ou de code enseignant par 10 minutes ; vérifications IA par groupe et par heure et par jour (réglables).
- Suivi : seuls le groupe (niveau + école), le défi, la question, l'heure et le résultat sont enregistrés (Upstash Redis). Les réponses écrites des élèves ne sont jamais conservées côté serveur ; elles sont envoyées à Albert pour correction. Un brouillon est gardé dans le navigateur de l'élève jusqu'à la réussite. À signaler dans le registre de traitements si nécessaire.
- La dictée utilise le service de reconnaissance vocale du navigateur : désactivée par défaut.
- Quota gratuit Upstash : 500 000 commandes par mois. Une vérification de réponse en consomme environ dix : compter une marge confortable pour plusieurs centaines de vérifications par jour.
