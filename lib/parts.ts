// ─── Parts list ─────────────────────────────────────────────────────────────
// Every project, public or private, as a row on a drawing's bill of materials.
//
// The first ten rows come from the source of truth for the GitHub profile,
// henrykanaskie/henrykanaskie data/profile.toml: same reference designators,
// same status bands, same completion figures. Change them there first and copy
// them here, so the site and the profile never disagree about a project.
// The last three are site-only projects that are not on the profile's sheet.

export type PartStatus = "QUALIFIED" | "FLIGHT" | "BREADBOARD" | "CONCEPT";

export interface Part {
  pn: string;
  name: string;
  does: string;
  stack: string;
  status: PartStatus;
  completion: number; // 0..1
  repo?: string;
  note?: string; // shown in place of a link
}

// Status is a band of completion, never set independently (profile.toml rule).
export const STATUS: Record<PartStatus, { mark: string; blurb: string }> = {
  QUALIFIED: { mark: "✓", blurb: "built, working, done" },
  FLIGHT: { mark: "▲", blurb: "in active development" },
  BREADBOARD: { mark: "◗", blurb: "assembled, not yet trustworthy" },
  CONCEPT: { mark: "○", blurb: "scaffold and intent" },
};

export const parts: Part[] = [
  {
    pn: "OPT-01",
    name: "Cap_Match_Net",
    does: "Picks capacitor values for an RF matching network from the parts the lab actually stocks.",
    stack: "Python · OR-Tools CP-SAT",
    status: "QUALIFIED",
    completion: 1,
    repo: "https://github.com/henrykanaskie/Cap_Match_Net",
  },
  {
    pn: "SYS-01",
    name: "small-shell",
    does: "A Unix shell in C with job control, I/O redirection and signal handling.",
    stack: "C · POSIX",
    status: "QUALIFIED",
    completion: 1,
    repo: "https://github.com/henrykanaskie/small-shell",
  },
  {
    pn: "MDL-02",
    name: "floralytics",
    does: "Ranks the plants worth planting in a county from the Oregon Bee Atlas.",
    stack: "Python · FastAPI · React",
    status: "QUALIFIED",
    completion: 1,
    repo: "https://github.com/Kellen-Sullivan/bee-plant-data-exploration",
  },
  {
    pn: "APP-03",
    name: "accliMate",
    does: "Answers questions about an unfamiliar codebase and cites the lines behind each answer.",
    stack: "Python · tree-sitter · ChromaDB",
    status: "QUALIFIED",
    completion: 1,
    repo: "https://github.com/henrykanaskie/accliMate",
  },
  {
    pn: "APP-01",
    name: "animAgent",
    does: "Shows running Claude Code agents as characters in a pixel-art room.",
    stack: "Swift · SpriteKit · AppKit",
    status: "QUALIFIED",
    completion: 1,
    repo: "https://github.com/henrykanaskie/animAgent",
  },
  {
    pn: "TUL-02",
    name: "groupStat",
    does: "Ranks a group chat eight ways from the tapbacks in a macOS Messages database.",
    stack: "Python stdlib · WKWebView",
    status: "QUALIFIED",
    completion: 1,
    note: "private",
  },
  {
    pn: "TUL-03",
    name: "Ground-Control",
    does: "Every repository on my disk with its git state, running agents and onboarding doc.",
    stack: "Node stdlib · Swift",
    status: "FLIGHT",
    completion: 0.9,
    repo: "https://github.com/henrykanaskie/Ground-Control",
  },
  {
    pn: "TUL-04",
    name: "orchestrate",
    does: "Runs a team of Claude Code agents at a project as a dependency graph.",
    stack: "Node stdlib",
    status: "FLIGHT",
    completion: 0.9,
    note: "private",
  },
  {
    pn: "APP-02",
    name: "GrowthApp",
    does: "A habit tracker that draws each streak as a filament of one graph.",
    stack: "SwiftUI · SwiftData · WidgetKit",
    status: "FLIGHT",
    completion: 0.62,
    note: "private",
  },
  {
    pn: "QNT-01",
    name: "aggregateAnalytics",
    does: "A margin-aware Elo model that predicts a margin for every NFL game.",
    stack: "Python · polars · scikit-learn",
    status: "FLIGHT",
    completion: 0.6,
    repo: "https://github.com/henrykanaskie/aggregateAnalytics",
  },
  {
    pn: "QNT-02",
    name: "ML_quantitative_research",
    does: "Monte Carlo portfolio risk: the distribution of outcomes, especially the tail.",
    stack: "Python · NumPy · SciPy",
    status: "FLIGHT",
    completion: 0.7,
    repo: "https://github.com/henrykanaskie/ML_quantitative_research",
  },
  {
    pn: "MDL-03",
    name: "gpt-scratch",
    does: "Transformer internals written by hand, from a single neuron up toward a GPT.",
    stack: "Python · PyTorch",
    status: "BREADBOARD",
    completion: 0.4,
    repo: "https://github.com/henrykanaskie/gpt-scratch",
  },
  {
    pn: "MDL-01",
    name: "emnist",
    does: "A feed-forward network with no framework, trained on EMNIST characters.",
    stack: "Python · NumPy",
    status: "QUALIFIED",
    completion: 1,
    repo: "https://github.com/henrykanaskie/emnist",
  },
];
