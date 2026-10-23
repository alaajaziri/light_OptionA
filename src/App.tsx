import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  Copy,
  Database,
  Globe,
  Grid2X2,
  HardDrive,
  Inbox,
  Maximize2,
  Minimize2,
  Monitor,
  Package,
  Printer,
  RefreshCw,
  Send,
  X,
  Zap,
} from "lucide-react";
import MintHexScene from "./components/MintHexScene";

type SlideInfo = {
  number: string;
  label: string;
  title: string;
};

const slides: SlideInfo[] = [
  { number: "01", label: "INTRODUCTION", title: "Node.js" },
  { number: "02", label: "DÉFINITION", title: "Qu'est-ce que Node.js ?" },
  { number: "03", label: "FONCTIONNEMENT", title: "La boucle d'événements" },
  { number: "04", label: "FONCTIONNALITÉS", title: "Les principales forces" },
  { number: "05", label: "DANS L'APPLICATION", title: "Son rôle dans le projet" },
  { number: "06", label: "EN PRATIQUE", title: "Un serveur en quelques lignes" },
  { number: "07", label: "SYNTHÈSE", title: "L'essentiel à retenir" },
];

const serverCode = `import { createServer } from 'node:http';

createServer((_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });
  const data = { message: 'Bonjour !' };
  res.end(JSON.stringify(data));
}).listen(3000);`;

/* ------------------------------------------------------------------ */
/* Utilitaires d'animation                                             */
/* ------------------------------------------------------------------ */

/** Index utilisé en CSS (`var(--i)`) pour décaler les animations d'entrée. */
const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * Horloge d'animation "par phases" (0 → steps-1, en boucle).
 * - Ne tourne QUE si la diapositive est active (zéro coût sinon).
 * - Respecte prefers-reduced-motion : affiche directement l'état final.
 */
function useLoopPhase(enabled: boolean, steps: number, interval: number) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase(steps - 1);
      return;
    }
    const id = window.setInterval(() => setPhase((p) => (p + 1) % steps), interval);
    return () => window.clearInterval(id);
  }, [enabled, steps, interval]);

  return phase;
}

/* ------------------------------------------------------------------ */
/* Mini coloration syntaxique                                          */
/* ------------------------------------------------------------------ */
const TOKEN_REGEX =
  /('[^']*')|\b(import|from|const)\b|\b(createServer|writeHead|end|listen|stringify)\b|\b(JSON)\b|\b(\d+)\b/g;

function renderCodeLine(line: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(line))) {
    if (match.index > last) nodes.push(line.slice(last, match.index));
    const cls = match[1]
      ? "token-string"
      : match[2]
        ? "token-keyword"
        : match[3]
          ? "token-fn"
          : match[4]
            ? "token-builtin"
            : "token-num";
    nodes.push(
      <span className={cls} key={key++}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < line.length) nodes.push(line.slice(last));
  return nodes.length ? nodes : " ";
}

function NodeMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 2.5 43 13.25v21.5L24 45.5 5 34.75v-21.5L24 2.5Z"
        fill="currentColor"
      />
      <text
        x="24"
        y="30.1"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="Space Grotesk Variable, sans-serif"
        fontSize="18"
        fontWeight="700"
        letterSpacing="-1.5"
      >
        JS
      </text>
    </svg>
  );
}

function Eyebrow({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="eyebrow">
      <span className="eyebrow-square" />
      <span>{number}</span>
      <span className="eyebrow-divider">/</span>
      <span>{children}</span>
    </div>
  );
}

function HeroSlide({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="hero-art" aria-hidden="true" />
      <div className="hero-shade" aria-hidden="true" />
      <div className="slide-inner hero-inner">
        <div className="hero-copy">
          <Eyebrow number="01">PRÉSENTATION EXPRESS</Eyebrow>
          <h1>
            Node<span className="hero-dot">.</span>js
          </h1>
          <h2>Le JavaScript<br />côté serveur.</h2>
          <p>
            Une introduction simple à son fonctionnement, ses forces et sa place
            dans une application web.
          </p>
          <button className="primary-button hero-cta" onClick={onNext}>
            Commencer la présentation <ArrowRight size={19} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </>
  );
}

const runtimeLayers = [
  { index: "01", title: "JavaScript", detail: "Le code que l'on écrit", core: false },
  { index: "02", title: "Moteur V8", detail: "Compile et exécute le code", core: false },
  { index: "03", title: "libuv", detail: "Boucle d'événements & E/S asynchrones", core: true },
  { index: "04", title: "APIs Node.js", detail: "Réseau, fichiers, processus...", core: false },
];

function DefinitionSlide() {
  return (
    <div className="slide-inner definition-layout">
      <div className="text-column">
        <Eyebrow number="02">DÉFINITION</Eyebrow>
        <h2 className="slide-title">
          Un environnement.<br /><span>Pas un langage.</span>
        </h2>
        <p className="slide-lead">
          Node.js permet d'exécuter du JavaScript <strong>en dehors du navigateur</strong>,
          notamment sur un serveur. Il assemble le moteur <strong>V8</strong> de Chrome
          et la bibliothèque <strong>libuv</strong> pour donner accès au réseau,
          aux fichiers et au système.
        </p>
      </div>

      <div className="runtime-visual" aria-label="Les quatre couches qui composent Node.js">
        <svg className="runtime-outline" viewBox="0 0 290 290" fill="none" aria-hidden="true">
          <path d="M145 17 255.85 81v128L145 273 34.15 209V81L145 17Z" stroke="currentColor" />
          <path d="M145 53 224.67 99v92L145 237l-79.67-46V99L145 53Z" stroke="currentColor" />
        </svg>
        <div className="visual-caption">ANATOMIE D'UN RUNTIME</div>
        <div className="runtime-rows">
          {runtimeLayers.map((layer, i) => (
            <div
              className={`runtime-row${layer.core ? " is-core" : ""}`}
              key={layer.index}
              style={stagger(i)}
            >
              <span className="runtime-index">{layer.index}</span>
              <div>
                <strong>{layer.title}</strong>
                <small>{layer.detail}</small>
              </div>
              {layer.core && <span className="runtime-badge">CŒUR ASYNC</span>}
            </div>
          ))}
        </div>
        <p className="runtime-note"><span />Ni un nouveau langage, ni un framework.</p>
      </div>
    </div>
  );
}

const flowSteps = [
  { number: "01", icon: Inbox, title: "Une requête arrive", detail: "Le serveur reçoit une demande." },
  { number: "02", icon: HardDrive, title: "L'E/S est déléguée", detail: "Fichier ou réseau est traité en arrière-plan par libuv." },
  { number: "03", icon: Zap, title: "Node continue", detail: "Le thread principal reste libre pour d'autres tâches." },
  { number: "04", icon: Send, title: "La réponse part", detail: "Le rappel (callback) s'exécute dès que le résultat est prêt." },
];

/* Boucle de 12 phases (~7,8 s) partagée entre les cartes et le schéma. */
const FLOW_PHASES = 12;
const FLOW_INTERVAL = 650;

function activeFlowStep(phase: number) {
  if (phase === 0) return 0;
  if (phase <= 2) return 1;
  if (phase <= 7) return 2;
  return 3;
}

function flowCaption(phase: number) {
  if (phase === 0) return "Une requête arrive sur le serveur.";
  if (phase <= 2) return "readFile() est délégué à libuv, en arrière-plan.";
  if (phase <= 7) return "Le thread principal reste libre : il traite d'autres tâches.";
  return "Le callback s'exécute : la réponse peut partir.";
}

const laneBlocks = [
  { at: 0, left: 1, label: "requête", kind: "" },
  { at: 1, left: 18, label: "readFile()", kind: "call" },
  { at: 3, left: 38, label: "tâche A", kind: "" },
  { at: 5, left: 58, label: "tâche B", kind: "" },
  { at: 8, left: 80, label: "callback", kind: "callback" },
];

/** Schéma animé : le thread principal n'attend jamais la lecture du fichier. */
function EventLoopLanes({ phase }: { phase: number }) {
  const progress = Math.min(Math.max((phase - 1) / 6, 0), 1);
  const caption = flowCaption(phase);

  return (
    <div
      className={`lanes${phase === 0 ? " is-reset" : ""}`}
      role="img"
      aria-label="Schéma animé : le thread principal continue pendant que libuv lit le fichier"
    >
      <span className="visual-caption">DEUX VOIES, ZÉRO ATTENTE</span>

      <div className="lane">
        <span className="lane-label">THREAD PRINCIPAL · JAVASCRIPT</span>
        <div className="lane-track">
          {laneBlocks.map((block) => (
            <span
              key={block.label}
              className={`lane-block${block.kind ? ` ${block.kind}` : ""}${block.at <= phase ? " on" : ""}`}
              style={{ left: `${block.left}%` }}
            >
              {block.label}
            </span>
          ))}
        </div>
      </div>

      <div className="lane">
        <span className="lane-label">ARRIÈRE-PLAN · LIBUV</span>
        <div className="lane-track">
          <div className="io-bar" style={{ left: "18%", width: "62%" }}>
            <span className="io-fill" style={{ transform: `scaleX(${progress})` }} />
            <span className="io-text">lecture du fichier…</span>
          </div>
        </div>
      </div>

      <p className="lane-caption" key={caption}>
        <span className="live-dot" aria-hidden="true" />
        {caption}
      </p>
    </div>
  );
}

function FunctioningSlide({ isActive }: { isActive: boolean }) {
  const phase = useLoopPhase(isActive, FLOW_PHASES, FLOW_INTERVAL);
  const liveStep = activeFlowStep(phase);

  return (
    <div className="slide-inner flow-layout">
      <div className="flow-intro">
        <div>
          <Eyebrow number="03">FONCTIONNEMENT</Eyebrow>
          <h2 className="slide-title">Un seul fil.<br /><span>Sans attendre les E/S.</span></h2>
        </div>
        <p className="slide-lead">
          La <strong>boucle d'événements</strong>, fournie par libuv, orchestre le travail.
          Les entrées/sorties sont prises en charge en arrière-plan ; Node.js
          récupère leur résultat dès qu'il est disponible.
        </p>
      </div>

      <div className="flow-timeline" aria-label="Les quatre étapes d'une opération asynchrone">
        <span
          className="flow-traveler"
          aria-hidden="true"
          style={{ left: `calc(${liveStep * 25}% + ${liveStep * 6 + 20}px)` }}
        />
        {flowSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              className={`flow-step${i === liveStep ? " is-live" : ""}`}
              key={step.number}
              style={stagger(i)}
            >
              <span className="flow-point" aria-hidden="true" />
              <div className="flow-step-top">
                <span className="flow-icon" aria-hidden="true">
                  <Icon size={19} strokeWidth={1.7} />
                </span>
                <span className="flow-number">{step.number}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="flow-bottom">
        <p className="flow-footnote">
          <span className="footnote-line" />
          Le code JavaScript s'exécute sur un seul thread : il faut éviter
          les calculs longs qui bloquent cette boucle.
        </p>
        <EventLoopLanes phase={phase} />
      </div>
    </div>
  );
}

const features = [
  { number: "01", icon: Globe, motion: "pulse", title: "HTTP & APIs", detail: "Recevoir des requêtes et renvoyer des données, souvent en JSON." },
  { number: "02", icon: RefreshCw, motion: "spin", title: "E/S asynchrones", detail: "Lire un fichier ou appeler un service sans figer le serveur." },
  { number: "03", icon: Boxes, motion: "float", title: "Modules natifs", detail: "Accéder aux fichiers, au réseau, aux flux et aux processus." },
  { number: "04", icon: Package, motion: "bob", title: "Écosystème npm", detail: "Installer des bibliothèques et automatiser le projet." },
];

function FeaturesSlide() {
  return (
    <div className="slide-inner features-layout">
      <div className="features-heading">
        <div>
          <Eyebrow number="04">FONCTIONNALITÉS</Eyebrow>
          <h2 className="slide-title">Les bonnes briques,<br /><span>au bon endroit.</span></h2>
        </div>
        <p className="slide-lead">
          Des outils intégrés et un vaste écosystème pour construire des
          applications côté serveur.
        </p>
      </div>
      <div className="features-grid">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div className="feature" key={feature.number} style={stagger(i)}>
              <span className={`feature-icon motion-${feature.motion}`} aria-hidden="true">
                <Icon size={21} strokeWidth={1.6} />
              </span>
              <div>
                <span className="feature-index">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.detail}</p>
              </div>
              <ArrowUpRight className="feature-arrow" size={22} strokeWidth={1.3} aria-hidden="true" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoleSlide() {
  return (
    <div className="slide-inner role-layout">
      <div className="role-heading">
        <div>
          <Eyebrow number="05">DANS L'APPLICATION</Eyebrow>
          <h2 className="slide-title">Entre l'interface<br /><span>et la donnée.</span></h2>
        </div>
        <p className="slide-lead">
          Dans une application avec un backend Node.js, il reçoit les requêtes,
          applique la logique métier et échange avec les données.
        </p>
      </div>

      <div className="architecture" aria-label="Interface utilisateur vers serveur Node.js vers données">
        <div className="architecture-part">
          <Monitor className="architecture-icon" size={39} strokeWidth={1.2} aria-hidden="true" />
          <span className="architecture-label">01 / CÔTÉ CLIENT</span>
          <h3>Interface</h3>
          <p>Affiche et envoie les actions de l'utilisateur.</p>
        </div>
        <div className="architecture-link" aria-hidden="true">
          <small className="link-label">HTTP · JSON</small>
          <span />
          <span className="back" />
        </div>
        <div className="architecture-part architecture-node">
          <div className="node-icon-wrap" aria-hidden="true">
            <span className="node-orbit" />
            <NodeMark className="architecture-icon architecture-mark" />
          </div>
          <span className="architecture-label">02 / CÔTÉ SERVEUR</span>
          <h3>Node.js</h3>
          <p>Expose l'API, exécute la logique et sécurise les échanges.</p>
          <span className="loop-chip"><RefreshCw size={12} strokeWidth={2} aria-hidden="true" /> boucle d'événements</span>
        </div>
        <div className="architecture-link" aria-hidden="true">
          <small className="link-label">REQUÊTES</small>
          <span />
          <span className="back" />
        </div>
        <div className="architecture-part">
          <Database className="architecture-icon" size={39} strokeWidth={1.2} aria-hidden="true" />
          <span className="architecture-label">03 / STOCKAGE</span>
          <h3>Données</h3>
          <p>Base de données et services externes.</p>
        </div>
      </div>

      <div className="development-note">
        <span className="development-plus">+</span>
        <p><strong>Pendant le développement,</strong> Node.js exécute aussi npm, Vite et les scripts de build.</p>
      </div>
    </div>
  );
}

/* Phase du scénario → lignes de code mises en évidence.
   0 : le serveur démarre   (.listen)
   1 : une requête arrive   (le gestionnaire est appelé)
   2 : en-têtes             (writeHead)
   3 : données              (const data)
   4+: réponse envoyée      (res.end)                                   */
const CODE_PHASES = 7;
const codeHighlights: number[][] = [[8], [2], [3, 4, 5], [6], [7], [7], [7]];

function CodeSlide({ isActive }: { isActive: boolean }) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const phase = useLoopPhase(isActive, CODE_PHASES, 1000);
  const hot = codeHighlights[phase];

  useEffect(() => () => {
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
  }, []);

  async function copyCode() {
    let success = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(serverCode);
        success = true;
      } catch {
        // Clipboard permissions can differ when the standalone HTML is opened locally.
      }
    }
    if (!success) {
      const textarea = document.createElement("textarea");
      textarea.value = serverCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      success = document.execCommand("copy");
      textarea.remove();
    }
    if (success) {
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <div className="slide-inner code-layout">
      <div className="code-heading">
        <div>
          <Eyebrow number="06">EN PRATIQUE</Eyebrow>
          <h2 className="slide-title">Un serveur.<br /><span>Quelques lignes.</span></h2>
        </div>
        <p className="slide-lead">
          Le module natif <code>node:http</code> suffit pour écouter une requête
          et répondre en JSON — sans rien installer.
        </p>
      </div>

      <div className="code-content">
        <div className="code-editor">
          <div className="code-editor-bar">
            <div className="window-dots" aria-hidden="true"><span /><span /><span /></div>
            <span className="filename">serveur.mjs</span>
            <button className="copy-button" onClick={copyCode} aria-label={copied ? "Code copié" : "Copier le code"}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? "Copié" : "Copier"}</span>
            </button>
          </div>
          <pre aria-label="Exemple de serveur HTTP en Node.js"><code>
            {serverCode.split("\n").map((line, index) => (
              <span
                className={`code-line${hot.includes(index) ? " is-hot" : ""}`}
                key={index}
                style={stagger(index)}
              >
                <span className="line-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="line-source">{renderCodeLine(line)}</span>
              </span>
            ))}
          </code></pre>
        </div>

        <div className="code-output">
          <span className="visual-caption">CE QUI SE PASSE</span>
          <span className={`run-command${phase === 0 ? " is-hot" : ""}`}>
            <i className="live-dot" aria-hidden="true" /> $ node serveur.mjs
          </span>
          <div className={`request-line step-item${phase >= 1 ? " on" : ""}`}><span>GET</span> localhost:3000</div>
          <span className={`output-connector${phase >= 2 ? " on" : ""}`} aria-hidden="true" />
          <div className={`response-block step-item${phase >= 4 ? " on" : ""}`}>
            <span className="status-badge">200 OK</span>
            <div className="response-line">{'{ "message": "Bonjour !" }'}</div>
          </div>
          <p>Node.js écoute sur le port 3000 et renvoie une réponse JSON.</p>
        </div>
      </div>
    </div>
  );
}

const takeaways = [
  { number: "01", text: "JavaScript s'exécute aussi hors du navigateur." },
  { number: "02", text: "L'asynchrone aide à gérer les entrées/sorties." },
  { number: "03", text: "Node.js sert aux APIs, aux scripts et aux outils." },
];

function SummarySlide({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="slide-inner summary-layout">
      <div className="summary-heading">
        <Eyebrow number="07">SYNTHÈSE</Eyebrow>
        <h2 className="slide-title">Node.js,<br /><span>en trois idées.</span></h2>
        <p className="slide-lead">Un même langage, du navigateur jusqu'aux outils et au serveur.</p>
        <button className="primary-button restart-button" onClick={onRestart}>
          Revoir la présentation <ArrowRight size={19} strokeWidth={1.8} />
        </button>
      </div>
      <div className="summary-right">
        <div className="takeaway-list">
          {takeaways.map((item, i) => (
            <div className="takeaway" key={item.number} style={stagger(i)}>
              <span>{item.number}</span>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <div className="source-links">
          <span>POUR ALLER PLUS LOIN</span>
          <a href="https://nodejs.org/en/about" target="_blank" rel="noopener noreferrer" style={stagger(0)}>
            À propos de Node.js <ArrowUpRight size={15} />
          </a>
          <a href="https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick" target="_blank" rel="noopener noreferrer" style={stagger(1)}>
            La boucle d'événements <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}

function getInitialSlide() {
  const match = window.location.hash.match(/^#slide-(\d+)$/);
  if (!match) return 0;
  return Math.min(Math.max(Number(match[1]) - 1, 0), slides.length - 1);
}

export default function App() {
  const [active, setActive] = useState(getInitialSlide);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const closeOverviewRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function goTo(index: number) {
    setActive(Math.min(Math.max(index, 0), slides.length - 1));
    setOverviewOpen(false);
  }

  useEffect(() => {
    window.history.replaceState(null, "", `#slide-${active + 1}`);
  }, [active]);

  useEffect(() => {
    function handleHashChange() {
      setActive(getInitialSlide());
    }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOverviewOpen(false);
        return;
      }
      if (overviewOpen) return;
      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select") && event.key === " ") return;

      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        setActive((current) => Math.min(current + 1, slides.length - 1));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setActive((current) => Math.max(current - 1, 0));
      } else if (event.key === "Home") {
        event.preventDefault();
        setActive(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setActive(slides.length - 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [overviewOpen]);

  useEffect(() => {
    if (overviewOpen) closeOverviewRef.current?.focus();
  }, [overviewOpen]);

  useEffect(() => {
    document.body.style.overflow = overviewOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overviewOpen]);

  useEffect(() => {
    function updateFullscreen() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen?.();
    }
  }

  function onTouchStart(event: React.TouchEvent) {
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (!touchStart.current) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.current.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(deltaX) > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      goTo(active + (deltaX < 0 ? 1 : -1));
    }
    touchStart.current = null;
  }

  const slideContents = [
    <HeroSlide onNext={() => goTo(1)} />,
    <DefinitionSlide />,
    <FunctioningSlide isActive={active === 2} />,
    <FeaturesSlide />,
    <RoleSlide />,
    <CodeSlide isActive={active === 5} />,
    <SummarySlide onRestart={() => goTo(0)} />,
  ];

  const isIntro = active === 0;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-lockup" onClick={() => goTo(0)} aria-label="Retour à la première diapositive">
          <NodeMark className="brand-mark" />
          <span className="brand-words"><strong>NODE.JS</strong><small>PRÉSENTATION</small></span>
        </button>
        <div className="topbar-center">DÉVELOPPEMENT WEB <span>/</span> GUIDE EXPRESS</div>
        <div className="topbar-actions">
          <button className="overview-trigger" onClick={() => setOverviewOpen(true)} aria-label="Ouvrir le sommaire">
            <Grid2X2 size={17} strokeWidth={1.7} /> <span>Sommaire</span>
          </button>
          <span className="action-divider" aria-hidden="true" />
          <button className="icon-button print-button" onClick={() => window.print()} title="Imprimer ou exporter en PDF" aria-label="Imprimer ou exporter en PDF">
            <Printer size={18} strokeWidth={1.7} />
          </button>
          <button className="icon-button fullscreen-button" onClick={toggleFullscreen} title={isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran"} aria-label={isFullscreen ? "Quitter le plein écran" : "Afficher en plein écran"}>
            {isFullscreen ? <Minimize2 size={18} strokeWidth={1.7} /> : <Maximize2 size={18} strokeWidth={1.7} />}
          </button>
        </div>
      </header>

      <div className="stage-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className={`global-mint-stage${isIntro ? " is-assembled" : " is-exploded"}`} aria-hidden="true">
          <MintHexScene exploded={!isIntro} interactive={isIntro} triggerKey={active} className="hero-model" resetKey={0} />
          <div className={`stage-dust${isIntro ? "" : " visible"}`} aria-hidden="true">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
        <div className="presentation-stage">
          {slides.map((slide, index) => (
            <section
              className={`slide slide-${index + 1}${active === index ? " is-active" : ""}`}
              key={slide.number}
              aria-label={`${slide.number} - ${slide.title}`}
              aria-hidden={active !== index}
              /* React 19 : booléen. React 18 : remplacer par
                 {...(active !== index ? { inert: "" } : {})} */
              inert={active !== index || undefined}
            >
              {slideContents[index]}
            </section>
          ))}
        </div>
      </div>

      <footer className="deck-footer">
        <div className="keyboard-hint"><span className="keycap">←</span><span className="keycap">→</span> Naviguer avec les flèches</div>
        <div className="deck-progress">
          <span className="current-number">{slides[active].number}</span>
          <div className="progress-segments" role="group" aria-label="Aller à une diapositive">
            {slides.map((slide, index) => (
              <button
                key={slide.number}
                className={`progress-segment${index <= active ? " reached" : ""}${index === active ? " current" : ""}`}
                onClick={() => goTo(index)}
                aria-label={`Diapositive ${slide.number} : ${slide.title}`}
                aria-current={index === active ? "step" : undefined}
              ><span /></button>
            ))}
          </div>
          <span className="total-number">{String(slides.length).padStart(2, "0")}</span>
        </div>
        <div className="footer-controls">
          <button className="nav-arrow prev-arrow" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Diapositive précédente">
            <ArrowLeft size={20} strokeWidth={1.8} />
          </button>
          <button className="nav-arrow next-arrow" onClick={() => goTo(active + 1)} disabled={active === slides.length - 1} aria-label="Diapositive suivante">
            <ArrowRight size={20} strokeWidth={1.8} />
          </button>
        </div>
      </footer>

      {overviewOpen && (
        <div className="overview-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOverviewOpen(false);
        }}>
          <aside className="overview-panel" role="dialog" aria-modal="true" aria-labelledby="overview-title">
            <div className="overview-header">
              <div><span className="overview-kicker">NAVIGATION</span><h2 id="overview-title">Sommaire<span>.</span></h2></div>
              <button className="overview-close" ref={closeOverviewRef} onClick={() => setOverviewOpen(false)} aria-label="Fermer le sommaire"><X size={22} /></button>
            </div>
            <nav className="overview-list" aria-label="Diapositives">
              {slides.map((slide, index) => (
                <button className={`overview-item${active === index ? " selected" : ""}`} key={slide.number} onClick={() => goTo(index)}>
                  <span className="overview-number">{slide.number}</span>
                  <span className="overview-item-text"><small>{slide.label}</small><strong>{slide.title}</strong></span>
                  <ArrowUpRight size={20} strokeWidth={1.5} />
                </button>
              ))}
            </nav>
            <div className="overview-bottom"><span>7 DIAPOSITIVES</span><button onClick={() => { setOverviewOpen(false); window.print(); }}><Printer size={15} /> Exporter en PDF</button></div>
          </aside>
        </div>
      )}
    </main>
  );
}