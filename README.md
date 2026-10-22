# Node.js — Présentation interactive

Une présentation web interactive et visuelle pour découvrir Node.js, son fonctionnement et sa place dans une application web moderne.

Le projet prend la forme d'un mini-diaporama en français avec une direction artistique claire, des animations, une scène 3D interactive et un exemple de serveur HTTP en Node.js.

## Aperçu

La présentation est organisée en sept diapositives :

1. **Introduction** — Node.js, le JavaScript côté serveur
2. **Définition** — Node.js est un environnement d'exécution, pas un langage
3. **Fonctionnement** — La boucle d'événements et les opérations asynchrones
4. **Fonctionnalités** — Les principales forces de Node.js
5. **Dans l'application** — Le rôle de Node.js dans une architecture web
6. **En pratique** — Un serveur HTTP en quelques lignes
7. **Synthèse** — Les notions essentielles à retenir

## Fonctionnalités

- Navigation par boutons, indicateurs de progression et sommaire
- Navigation au clavier avec les touches `←`, `→`, `PageUp`, `PageDown`, `Home`, `End` et `Espace`
- Navigation tactile par balayage horizontal sur mobile
- Scène 3D WebGL interactive sur la page d'accueil
- Animations synchronisées avec la diapositive active
- Respect de la préférence système `prefers-reduced-motion`
- Exemple de code Node.js avec coloration syntaxique
- Copie de l'exemple de code dans le presse-papiers
- Mode plein écran
- Impression ou export PDF via la boîte de dialogue d'impression du navigateur
- Structure sémantique et attributs ARIA pour faciliter l'utilisation avec les technologies d'assistance
- Mise en pause des animations des diapositives masquées pour limiter le travail inutile du navigateur

## Stack technique

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) via `@tailwindcss/vite`
- [React Three Fiber](https://r3f.docs.pmnd.rs/) et [Drei](https://github.com/pmndrs/drei) pour la scène 3D
- [Three.js](https://threejs.org/)
- [Lucide React](https://lucide.dev/) pour les icônes
- Polices Manrope, Space Grotesk et DM Mono via Fontsource

## Prérequis

- Node.js 18 ou une version plus récente
- npm

## Installation

Depuis le dossier du projet :

```bash
npm install
```

## Développement

Lancer le serveur de développement Vite :

```bash
npm run dev
```

Vite affichera l'URL locale, généralement [`http://localhost:5173`](http://localhost:5173).

## Production

Créer une version optimisée :

```bash
npm run build
```

Les fichiers générés sont placés dans `dist/`. La configuration utilise `vite-plugin-singlefile` afin de faciliter la distribution d'une page autonome.

Prévisualiser le build de production :

```bash
npm run preview
```

## Commandes disponibles

| Commande | Description |
| --- | --- |
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile et optimise l'application |
| `npm run preview` | Sert localement le build de production |

## Contrôles

| Action | Contrôle |
| --- | --- |
| Diapositive suivante | `→`, `PageDown`, `Espace` ou balayage vers la gauche |
| Diapositive précédente | `←`, `PageUp` ou balayage vers la droite |
| Première diapositive | `Home` |
| Dernière diapositive | `End` |
| Aller à une diapositive | Indicateurs de progression ou sommaire |
| Plein écran | Bouton en haut à droite |
| Export PDF | Bouton d'impression, puis choisir « Enregistrer au format PDF » |
| Copier le code | Bouton de copie dans la sixième diapositive |

## Structure du projet

```text
.
├── public/
│   └── images/             # Ressources statiques
├── src/
│   ├── components/
│   │   └── MintHexScene.tsx # Scène 3D React Three Fiber
│   ├── three/
│   │   └── createMintHexObject.ts
│   ├── utils/
│   │   └── cn.ts            # Utilitaire de composition de classes
│   ├── App.tsx              # Slides, navigation et interactions
│   ├── index.css            # Styles, responsive design et animations
│   └── main.tsx             # Point d'entrée React
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Accessibilité et responsive design

L'interface est conçue pour fonctionner sur ordinateur, tablette et mobile. Les éléments interactifs disposent de libellés accessibles, les diapositives inactives sont retirées de l'ordre de navigation, et les animations sont réduites lorsque la préférence système correspondante est activée.

Pour une présentation confortable, un écran d'au moins 768 px de largeur est recommandé, mais la navigation tactile et la mise en page mobile restent prises en charge.

## Licence

Aucune licence open source n'est actuellement déclarée pour ce projet. Ajoutez un fichier `LICENSE` et mettez à jour cette section avant toute redistribution publique.
