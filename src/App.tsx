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
  { number: "02", label: "DEFINITION", title: "What is Node.js?" },
  { number: "03", label: "HOW IT WORKS", title: "The event loop" },
  { number: "04", label: "FEATURES", title: "The main strengths" },
  { number: "05", label: "IN THE APPLICATION", title: "Its role in the project" },
  { number: "06", label: "IN PRACTICE", title: "A server in a few lines" },
  { number: "07", label: "SUMMARY", title: "The essentials to remember" },
];

const serverCode = `import { createServer } from 'node:http';

createServer((_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });
  const data = { message: 'Hello!' };
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

function HeroSlide({ onNext, isActive }: { onNext: () => void; isActive: boolean }) {
  const [mounted, setMounted] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setMounted(true);
      return;
    }
    const id = window.setTimeout(() => setMounted(false), 900);
    return () => window.clearTimeout(id);
  }, [isActive]);

  return (
    <>
      <div className="hero-art" aria-hidden="true">
        {mounted && (
          <MintHexScene
            className="hero-model"
            rotating={isActive}
            assembled={isActive}
            resetKey={0}
          />
        )}
      </div>
      <div className="hero-shade" aria-hidden="true" />
      <div className="slide-inner hero-inner">
        <div className="hero-copy">
          <Eyebrow number="01">QUICK INTRODUCTION</Eyebrow>
          <h1>
            Node<span className="hero-dot">.</span>js
          </h1>
          <h2>JavaScript<br />on the server.</h2>
          <p>
            A simple introduction to how it works, its strengths, and its place
            in a web application.
          </p>
          <button className="primary-button hero-cta" onClick={onNext}>
            Start the presentation <ArrowRight size={19} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </>
  );
}

const runtimeLayers = [
  { index: "01", title: "JavaScript", detail: "The code we write", core: false },
  { index: "02", title: "V8 engine", detail: "Compiles and runs the code", core: false },
  { index: "03", title: "libuv", detail: "Event loop & asynchronous I/O", core: true },
  { index: "04", title: "Node.js APIs", detail: "Network, files, processes...", core: false },
];

function DefinitionSlide() {
  return (
    <div className="slide-inner definition-layout">
      <div className="text-column">
        <Eyebrow number="02">DEFINITION</Eyebrow>
        <h2 className="slide-title">
          A runtime.<br /><span>Not a language.</span>
        </h2>
        <p className="slide-lead">
          Node.js runs JavaScript <strong>outside the browser</strong>, especially
          on a server. It combines Chrome's <strong>V8</strong> engine with the
          <strong>libuv</strong> library to provide access to the network, files,
          and the operating system.
        </p>
      </div>

      <div className="runtime-visual" aria-label="The four layers that make up Node.js">
        <svg className="runtime-outline" viewBox="0 0 290 290" fill="none" aria-hidden="true">
          <path d="M145 17 255.85 81v128L145 273 34.15 209V81L145 17Z" stroke="currentColor" />
          <path d="M145 53 224.67 99v92L145 237l-79.67-46V99L145 53Z" stroke="currentColor" />
        </svg>
        <div className="visual-caption">RUNTIME ANATOMY</div>
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
              {layer.core && <span className="runtime-badge">ASYNC CORE</span>}
            </div>
          ))}
        </div>
        <p className="runtime-note"><span />Neither a new language nor a framework.</p>
      </div>
    </div>
  );
}

const flowSteps = [
  { number: "01", icon: Inbox, title: "A request arrives", detail: "The server receives a request." },
  { number: "02", icon: HardDrive, title: "I/O is delegated", detail: "A file or network operation is handled in the background by libuv." },
  { number: "03", icon: Zap, title: "Node continues", detail: "The main thread remains free for other tasks." },
  { number: "04", icon: Send, title: "The response is sent", detail: "The callback runs as soon as the result is ready." },
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
  if (phase === 0) return "A request arrives at the server.";
  if (phase <= 2) return "readFile() is delegated to libuv in the background.";
  if (phase <= 7) return "The main thread remains free to handle other tasks.";
  return "The callback runs: the response can be sent.";
}

const laneBlocks = [
  { at: 0, left: 1, label: "request", kind: "" },
  { at: 1, left: 18, label: "readFile()", kind: "call" },
  { at: 3, left: 38, label: "task A", kind: "" },
  { at: 5, left: 58, label: "task B", kind: "" },
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
      aria-label="Animated diagram: the main thread continues while libuv reads the file"
    >
      <span className="visual-caption">TWO PATHS, ZERO WAITING</span>

      <div className="lane">
        <span className="lane-label">MAIN THREAD · JAVASCRIPT</span>
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
        <span className="lane-label">BACKGROUND · LIBUV</span>
        <div className="lane-track">
          <div className="io-bar" style={{ left: "18%", width: "62%" }}>
            <span className="io-fill" style={{ transform: `scaleX(${progress})` }} />
            <span className="io-text">reading file…</span>
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
          <Eyebrow number="03">HOW IT WORKS</Eyebrow>
          <h2 className="slide-title">One thread.<br /><span>Without waiting on I/O.</span></h2>
        </div>
        <p className="slide-lead">
          The <strong>event loop</strong>, provided by libuv, orchestrates the work.
          Input/output operations are handled in the background; Node.js receives
          their results as soon as they are available.
        </p>
      </div>

      <div className="flow-timeline" aria-label="The four steps of an asynchronous operation">
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
          JavaScript runs on a single thread: avoid long computations
          that block this loop.
        </p>
        <EventLoopLanes phase={phase} />
      </div>
    </div>
  );
}

const features = [
  { number: "01", icon: Globe, motion: "pulse", title: "HTTP & APIs", detail: "Receive requests and return data, often as JSON." },
  { number: "02", icon: RefreshCw, motion: "spin", title: "Asynchronous I/O", detail: "Read a file or call a service without freezing the server." },
  { number: "03", icon: Boxes, motion: "float", title: "Built-in modules", detail: "Access files, networking, streams, and processes." },
  { number: "04", icon: Package, motion: "bob", title: "npm ecosystem", detail: "Install libraries and automate the project." },
];

function FeaturesSlide() {
  return (
    <div className="slide-inner features-layout">
      <div className="features-heading">
        <div>
          <Eyebrow number="04">FEATURES</Eyebrow>
          <h2 className="slide-title">The right building blocks,<br /><span>in the right place.</span></h2>
        </div>
        <p className="slide-lead">
          Built-in tools and a vast ecosystem for building
          server-side applications.
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
          <Eyebrow number="05">IN THE APPLICATION</Eyebrow>
          <h2 className="slide-title">Between the interface<br /><span>and the data.</span></h2>
        </div>
        <p className="slide-lead">
          In an application with a Node.js backend, it receives requests,
          applies business logic, and communicates with data sources.
        </p>
      </div>

      <div className="architecture" aria-label="User interface to Node.js server to data">
        <div className="architecture-part">
          <Monitor className="architecture-icon" size={39} strokeWidth={1.2} aria-hidden="true" />
          <span className="architecture-label">01 / CLIENT SIDE</span>
          <h3>Interface</h3>
          <p>Displays and sends user actions.</p>
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
          <span className="architecture-label">02 / SERVER SIDE</span>
          <h3>Node.js</h3>
          <p>Exposes the API, runs the logic, and secures communication.</p>
          <span className="loop-chip"><RefreshCw size={12} strokeWidth={2} aria-hidden="true" /> event loop</span>
        </div>
        <div className="architecture-link" aria-hidden="true">
          <small className="link-label">REQUESTS</small>
          <span />
          <span className="back" />
        </div>
        <div className="architecture-part">
          <Database className="architecture-icon" size={39} strokeWidth={1.2} aria-hidden="true" />
          <span className="architecture-label">03 / STORAGE</span>
          <h3>Data</h3>
          <p>Database and external services.</p>
        </div>
      </div>

      <div className="development-note">
        <span className="development-plus">+</span>
        <p><strong>During development,</strong> Node.js also runs npm, Vite, and build scripts.</p>
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
          <Eyebrow number="06">IN PRACTICE</Eyebrow>
          <h2 className="slide-title">A server.<br /><span>Just a few lines.</span></h2>
        </div>
        <p className="slide-lead">
          The built-in <code>node:http</code> module is enough to listen for a request
          and respond with JSON — no installation required.
        </p>
      </div>

      <div className="code-content">
        <div className="code-editor">
          <div className="code-editor-bar">
            <div className="window-dots" aria-hidden="true"><span /><span /><span /></div>
            <span className="filename">server.mjs</span>
            <button className="copy-button" onClick={copyCode} aria-label={copied ? "Code copied" : "Copy code"}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <pre aria-label="Node.js HTTP server example"><code>
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
          <span className="visual-caption">WHAT HAPPENS</span>
          <span className={`run-command${phase === 0 ? " is-hot" : ""}`}>
            <i className="live-dot" aria-hidden="true" /> $ node server.mjs
          </span>
          <div className={`request-line step-item${phase >= 1 ? " on" : ""}`}><span>GET</span> localhost:3000</div>
          <span className={`output-connector${phase >= 2 ? " on" : ""}`} aria-hidden="true" />
          <div className={`response-block step-item${phase >= 4 ? " on" : ""}`}>
            <span className="status-badge">200 OK</span>
            <div className="response-line">{'{ "message": "Hello!" }'}</div>
          </div>
          <p>Node.js listens on port 3000 and returns a JSON response.</p>
        </div>
      </div>
    </div>
  );
}

const takeaways = [
  { number: "01", text: "JavaScript also runs outside the browser." },
  { number: "02", text: "Asynchronous operations help handle input/output." },
  { number: "03", text: "Node.js powers APIs, scripts, and tools." },
];

function SummarySlide({ isActive }: { isActive: boolean }) {
  return (
    <div className="slide-inner summary-layout">
      <div className="summary-heading">
        <Eyebrow number="07">SUMMARY</Eyebrow>
        <h2 className="slide-title">Node.js,<br /><span>in three ideas.</span></h2>
        <p className="slide-lead">One language, from the browser to tools and the server.</p>
        <div className="takeaway-list">
          {takeaways.map((item, i) => (
            <div className="takeaway" key={item.number} style={stagger(i)}>
              <span>{item.number}</span>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="summary-right" aria-hidden="true">
        {isActive && (
          <MintHexScene
            className="summary-model"
            rotating
            assembled
            resetKey={0}
            modelScale={1.1}
            modelOffsetX={-0.2}
            modelOffsetY={-0.2}
          />
        )}
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
    <HeroSlide onNext={() => goTo(1)} isActive={active === 0} />,
    <DefinitionSlide />,
    <FunctioningSlide isActive={active === 2} />,
    <FeaturesSlide />,
    <RoleSlide />,
    <CodeSlide isActive={active === 5} />,
    <SummarySlide isActive={active === 6} />,
  ];

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-lockup" onClick={() => goTo(0)} aria-label="Return to the first slide">
          <NodeMark className="brand-mark" />
          <span className="brand-words"><strong>NODE.JS</strong><small>PRESENTATION</small></span>
        </button>
        <div className="topbar-center">WEB DEVELOPMENT <span>/</span> QUICK GUIDE</div>
        <div className="topbar-actions">
          <button className="overview-trigger" onClick={() => setOverviewOpen(true)} aria-label="Ouvrir le sommaire">
            <Grid2X2 size={17} strokeWidth={1.7} /> <span>Overview</span>
          </button>
          <span className="action-divider" aria-hidden="true" />
          <button className="icon-button print-button" onClick={() => window.print()} title="Print or export as PDF" aria-label="Print or export as PDF">
            <Printer size={18} strokeWidth={1.7} />
          </button>
          <button className="icon-button fullscreen-button" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
            {isFullscreen ? <Minimize2 size={18} strokeWidth={1.7} /> : <Maximize2 size={18} strokeWidth={1.7} />}
          </button>
        </div>
      </header>

      <div className="presentation-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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

      <footer className="deck-footer">
        <div className="keyboard-hint"><span className="keycap">←</span><span className="keycap">→</span> Navigate with the arrow keys</div>
        <div className="deck-progress">
          <span className="current-number">{slides[active].number}</span>
          <div className="progress-segments" role="group" aria-label="Go to a slide">
            {slides.map((slide, index) => (
              <button
                key={slide.number}
                className={`progress-segment${index <= active ? " reached" : ""}${index === active ? " current" : ""}`}
                onClick={() => goTo(index)}
                aria-label={`Slide ${slide.number}: ${slide.title}`}
                aria-current={index === active ? "step" : undefined}
              ><span /></button>
            ))}
          </div>
          <span className="total-number">{String(slides.length).padStart(2, "0")}</span>
        </div>
        <div className="footer-controls">
          <button className="nav-arrow prev-arrow" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous slide">
            <ArrowLeft size={20} strokeWidth={1.8} />
          </button>
          <button className="nav-arrow next-arrow" onClick={() => goTo(active + 1)} disabled={active === slides.length - 1} aria-label="Next slide">
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
              <div><span className="overview-kicker">NAVIGATION</span><h2 id="overview-title">Overview<span>.</span></h2></div>
              <button className="overview-close" ref={closeOverviewRef} onClick={() => setOverviewOpen(false)} aria-label="Fermer le sommaire"><X size={22} /></button>
            </div>
            <nav className="overview-list" aria-label="Slides">
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