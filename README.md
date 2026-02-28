# Editorial Management — Frontend

## Description

Interface web de gestion éditoriale permettant aux éditeurs et administrateurs de créer, gérer et publier des articles, d'organiser les catégories, d'envoyer des notifications email et d'importer du contenu. L'application inclut un tableau de bord avec statistiques, une authentification JWT et une gestion des droits par rôle (admin / editor).

## Prérequis

- Node.js >= 18.x
- npm >= 9.x
- Le backend `editorial_management_back` doit être démarré et accessible (voir son README)

## Installation

```bash
# Depuis le dossier editorial_management_front
npm install
```

Créer un fichier `.env` à la racine :

```env
VITE_API_URL=http://localhost:4000/api
```

## Lancement

```bash
# Démarrer le backend (depuis editorial_management_back)
npm run dev

# Démarrer le frontend (depuis editorial_management_front)
npm run dev
```

Le frontend est accessible sur `http://localhost:3000` par défaut.

## Choix techniques

- **React 19 + TypeScript** — framework UI moderne avec typage statique pour fiabilité et maintenabilité
- **Vite 7** — bundler ultra-rapide avec HMR quasi-instantané, remplace Create React App
- **React Router v7** — routing déclaratif avec routes protégées (`ProtectedRoute`) basées sur le token JWT
- **Zustand** — gestion d'état globale minimaliste (auth, utilisateur courant) sans boilerplate Redux
- **React Hook Form + Zod** — formulaires performants avec validation côté client typée, cohérente avec le backend
- **TipTap** — éditeur de texte riche extensible pour la rédaction d'articles au format HTML
- **Tailwind CSS v4 + shadcn/ui** — design system cohérent via Radix UI, composants accessibles et rapides à mettre en place
- **Axios** — client HTTP avec intercepteurs pour l'injection automatique du token JWT et la gestion des erreurs 401
- **Recharts** — visualisation des statistiques du tableau de bord
- **Sonner** — notifications toast légères et non intrusives
- **Compromis** : pas de tests unitaires ni E2E faute de temps ; les custom hooks (`useArticles`, `useCategories`…) centralisent la logique métier pour faciliter leur ajout ultérieur

## Fonctionnalités implémentées

| Fonctionnalité                                   | Statut                                                    |
| ------------------------------------------------ | --------------------------------------------------------- |
| Authentification (login / logout / JWT)          | Complet                                                   |
| Routes protégées par rôle                        | Complet                                                   |
| Dashboard avec statistiques                      | Complet                                                   |
| Liste des articles avec filtres et recherche     | Complet                                                   |
| Création / édition d'article (éditeur riche)     | Complet                                                   |
| Gestion des statuts (brouillon, publié, archivé) | Complet                                                   |
| Gestion des catégories (CRUD)                    | Complet                                                   |
| Envoi de notifications email                     | Complet                                                   |
| Import d'articles                                | Complet                                                   |
| Gestion multi-réseau (Network)                   | Complet                                                   |
| Mode sombre / clair                              | Complet                                                   |
| Pagination                                       | Partiel — côté client uniquement                          |
| Gestion des erreurs globale                      | Partiel — intercepteur Axios, pas de React Error Boundary |

## Ce qui aurait été fait avec plus de temps

1. Tests unitaires sur les hooks et les composants de formulaire (Vitest + Testing Library)
2. Tests E2E sur les parcours critiques (Playwright)
3. Pagination serveur pour les listes d'articles
4. Gestion fine des permissions par réseau dans l'UI
5. Lazy loading des routes pour réduire le bundle initial
6. Internationalisation (i18n)
7. Accessibilité renforcée (revue ARIA, navigation clavier exhaustive)
8. Optimistic updates sur les mutations pour une meilleure réactivité

## Tests

Aucun test automatisé n'est configuré dans cette version.

```bash
# Linter uniquement
npm run lint
```

## Difficultés rencontrées

- **Compatibilité TipTap v3 + React 19** — TipTap v3 étant en release candidate, certaines peer dependencies entraient en conflit. Résolu en épinglant les versions exactes dans `package.json`.
- **Tailwind CSS v4** — la configuration diffère significativement de la v3 (plus de `tailwind.config.js`, intégration via plugin Vite). Nécessitait de revoir la documentation de migration.
- **Gestion du token JWT avec Axios** — mise en place d'un intercepteur de requête pour injecter le header `Authorization` et d'un intercepteur de réponse pour rediriger vers `/login` en cas de 401, sans créer de boucle infinie sur la route de login.
