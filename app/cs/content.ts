import type { InfoBoxProps } from "@/components/InfoBox";
import type { Project, SvgConfig } from "@/components/ProjectCard";
import { beePaths } from "@/svgs/beePaths";
import { cpuPaths } from "@/svgs/cpuPaths";
import { daimlerPaths } from "@/svgs/daimlerPaths";
import { dronesPaths } from "@/svgs/dronesPaths";
import { fpgaPaths } from "@/svgs/fpgaPaths";
import { nnPaths } from "@/svgs/nnPaths";
import { thrusterPaths } from "@/svgs/thrusterPaths";

// ─── The CS page's words ────────────────────────────────────────────────────
// Everything /cs says, separate from how it's laid out.

export const ABOUT =
  "Hey there! My name's Henry. I'm a Computer Science master's student at Oregon State University, where I also finished my honors undergrad, and I'm joining Daimler Truck North America as an intern. I'm passionate about machine learning, space, and medicine, and I love working on software and impactful technology that helps people. I'm driven by problems where computation meets real-world change and improvement. Outside of engineering, I'm usually behind a camera, on the slopes, lifting, or finding new music. I value growth and learning above everything, and I'm always excited to connect with others who share that mindset!";

// ── Experience ────────────────────────────────────────────────────────────────
// Cards alternate sides down the page; each one's "More Info" bubble buds off
// its far side.

export const EXPERIENCE: InfoBoxProps[] = [
  // TODO(henry): add the role, team, dates and stack once they're public, and an
  // extraInfo block like the others so the "More Info" bubble appears.
  {
    side: "left",
    title: "Intern",
    company: "Daimler Truck North America",
    role: "Commercial Vehicles",
    description:
      "I'm joining Daimler Truck North America, the company behind Freightliner, as an intern. It's early, so this entry is short on purpose: I'll write it up properly once there's work here I can talk about.",
    svgPaths: daimlerPaths,
    svgSize: 70,
    svgDrawDuration: 5,
    svgOffset: { x: 50, y: -30 },
  },
  {
    side: "right",
    title: "Software Engineering Intern",
    company: "DZYNE Technologies",
    role: "Embedded Systems & Full-Stack",
    description:
      "I worked on a small team writing embedded C and C++ for anti-drone defense systems. The codebase had grown organically and needed serious cleanup: I refactored the core modules to be properly modular, which made a real difference in how fast the team could move. I also rebuilt the Python test infrastructure from scratch because the old one was slow and required too much manual babysitting. The most fun part was building a full-stack GUI in React and Flask that gave operators real-time control over power, tracking, and logging during test runs: something that previously meant running a bunch of scripts by hand.",
    svgPaths: dronesPaths,
    svgSize: 60,
    svgDrawDuration: 3,
    extraInfo: {
      startDate: "Mar 2025",
      endDate: "Sep 2025",
      techStack: "Python, C, C++, SQL, React",
      location: "Portland, OR",
      industry: "Defense Technology",
    },
  },
  {
    side: "left",
    title: "Applied Machine Learning Researcher",
    company: "Plasma, Energy, and Space Propulsion Laboratory",
    role: "Signal Processing & ML",
    description:
      "I split my time between the thruster side and the biomedical side of the lab, doing ML and signal processing work on both. A big chunk of it was building pipelines to extract clean signals from really noisy sensor data: plasma environments are brutal for that. On the modeling side, I worked on predictive models trained on large experimental datasets. One of the more interesting problems was automating capacitor tuning for RF plasma systems using Google OR-tools, replacing a slow manual process with something that ran dynamically and maximized power coupling in real time.",
    svgPaths: thrusterPaths,
    svgDrawDuration: 6,
    svgSize: 75,
    svgRotate: 45,
    svgOffset: { x: -5, y: 50 },
    extraInfo: {
      startDate: "May 2024",
      endDate: "Jun 2026",
      techStack: "MATLAB, Python, OR-tools",
      location: "Corvallis, OR",
      industry: "Aerospace Research",
    },
  },
  {
    side: "right",
    title: "Undergraduate Researcher",
    company: "Jason Clark Research Group",
    role: "FPGA & DSP Engineering",
    description:
      "The lab works on precision sensing at the micro and nano scale, and my job was building the FPGA-based DSP system that let them actually measure the signals they cared about. Nano-ampere acquisition was something the lab hadn't been able to do before, and getting there meant writing VHDL modules, building thorough testbenches, and then integrating artificial damping algorithms through Hardware-in-the-Loop testing with Moku instrumentation to get the sensors stable enough to trust.",
    svgPaths: fpgaPaths,
    svgSize: 65,
    svgOffset: { x: -45, y: 10 },
    svgDrawDuration: 4,
    extraInfo: {
      startDate: "Feb 2024",
      endDate: "Mar 2025",
      techStack: "VHDL, FPGA, Moku",
      location: "Corvallis, OR",
      industry: "Electrical Engineering Research",
    },
  },
];

// ── Projects ──────────────────────────────────────────────────────────────────

// Stand-in corner art for the projects that don't have their own drawing yet.
// Mirrored so a card in the left column gets top-left art and one in the right
// column gets top-right, matching the cards that do have real art. Replace a
// card's `svgs` entry with its own paths/size/offset when the drawing exists.
const placeholderSvgLeft: SvgConfig = {
  paths: cpuPaths,
  corner: "top-left",
  size: 46,
  rotate: -6,
  offset: { x: 20, y: 8 },
  drawDuration: 4,
};

const placeholderSvgRight: SvgConfig = {
  paths: cpuPaths,
  corner: "top-right",
  size: 46,
  rotate: 6,
  offset: { x: -20, y: 8 },
  drawDuration: 4,
};

export const PROJECTS: Project[] = [
  {
    title: "AccliMate: Codebase Onboarding Assistant",
    techStack: "Python, FastAPI, ChromaDB, D3.js",
    thumbnail: "/projects/acclimate.webp",
    description:
      "Paste a GitHub URL, get an interactive guide to the repository. Source is chunked by AST rather than line count and reranked before an LLM answers, so every claim cites the exact lines behind it. Q&A, architecture walkthroughs, an agentic mode, and dependency tracing. Built at BeaverHacks 2026.",
    links: {
      githubUrl: "https://github.com/henrykanaskie/accliMate",
    },
    svgs: [placeholderSvgLeft],
  },
  {
    title: "Sprite Room: Agents as Pixel Art",
    techStack: "Swift 6, SpriteKit, AppKit",
    thumbnail: "/projects/sprite-room.webp",
    description:
      "A macOS app that drops from the notch and renders a live coding agent's activity as a pixel-art room: each agent a character, each tool call something it is visibly doing. Read-only by design: it never controls an agent or shows prompt content. 871 tests across 87 suites and a replay harness keep the scene deterministic.",
    links: {
      githubUrl: "https://github.com/henrykanaskie/animAgent",
    },
    svgs: [placeholderSvgRight],
  },
  {
    title: "Monte Carlo Portfolio Risk Engine",
    techStack: "Python, NumPy, Pandas, SciPy",
    thumbnail: "/projects/monte-carlo.webp",
    description:
      "A risk and planning tool, not a predictor: it reports the distribution of portfolio outcomes, especially the ugly tail. Log returns throughout, correlation from joint historical sampling, and a block bootstrap measured against a Gaussian baseline over a survivorship-unbiased price panel.",
    links: {
      githubUrl: "https://github.com/henrykanaskie/ML_quantitative_research",
    },
    svgs: [placeholderSvgLeft],
  },
  {
    title: "GPT From Scratch",
    techStack: "Python, PyTorch, NumPy",
    thumbnail: "/projects/gpt-scratch.webp",
    description:
      "Transformer internals written by hand rather than imported: self-attention, multi-head attention, positional encoding, and layer, batch, and RMS normalization over a BPE tokenizer. Built up from a single neuron and backprop, so no layer of the stack stays a black box. In progress toward a full GPT.",
    links: {
      githubUrl: "https://github.com/henrykanaskie/gpt-scratch",
    },
    svgs: [placeholderSvgRight],
  },
  {
    title: "Capacitor Matching Network Solver",
    techStack: "Python, OR-Tools, NumPy",
    thumbnail: "/projects/cap-match-net.webp",
    description:
      "Constraint programming applied to an RF layout problem: pick four capacitors from a real, discrete inventory so a bridge network lands on a target capacitance. CP-SAT balances range compliance, absolute accuracy, and set spread, so the answer is electrically symmetric rather than merely close on paper.",
    links: {
      githubUrl: "https://github.com/henrykanaskie/Cap_Match_Net",
    },
    svgs: [placeholderSvgLeft],
  },
  {
    title: "smallsh: A Unix Shell in C",
    techStack: "C, POSIX",
    thumbnail: "/projects/smallsh.webp",
    description:
      "A shell with the parts that actually bite: job control, foreground and background execution, I/O redirection, variable expansion, and custom SIGINT and SIGTSTP handlers that stay correct once a process has been backgrounded and signalled at the wrong moment.",
    links: {
      githubUrl: "https://github.com/henrykanaskie/small-shell",
    },
    svgs: [placeholderSvgRight],
  },
  {
    title: "Bee Habitat Recommendation System",
    techStack: "Python, React, JavaScript",
    thumbnail: "/projects/bee-atlas.webp",
    description:
      "A recommendation engine built on the Oregon Bee Atlas that models bee-flower relationships as a sparse matrix and uses truncated SVD to surface ecologically relevant plant species for a given area: a practical tool for land managers making habitat restoration decisions.",
    links: {
      githubUrl:
        "https://github.com/Kellen-Sullivan/bee-plant-data-exploration",
      siteUrl: "https://kellen-sullivan.github.io/bee-plant-data-exploration/",
    },
    svgs: [
      {
        paths: beePaths,
        corner: "top-left",
        size: 75,
        rotate: -10,
        offset: { x: 25, y: -20 },
        drawDuration: 3,
      },
    ],
  },
  {
    title: "Character Classification Neural Network: From Scratch",
    techStack: "Python, NumPy, Pandas",
    thumbnail: "/projects/emnist.webp",
    description:
      "A feed-forward neural network built entirely from scratch: backpropagation, weight initialization, and the full training loop without any ML framework. Trained on EMNIST handwritten characters, reaching 85% test accuracy. The goal was intuition, not just a working model.",
    links: {
      githubUrl: "https://github.com/henrykanaskie/emnist",
    },
    svgs: [
      {
        paths: nnPaths,
        corner: "top-right",
        size: 60,
        rotate: 0,
        offset: { x: -10, y: 10 },
        drawDuration: 4,
      },
    ],
  },
];
