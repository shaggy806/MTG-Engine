import { defineCard } from "../define.js";

const ALL = { type: "creature" } as const;

// The creatures are fixed as it resolves (rule 611.2c).
export default defineCard({
  name: "Insurrection",
  manaCost: "{5}{R}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Untap all creatures and gain control of them until end of turn. They gain haste until end of turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "untap-all", filter: ALL },
      { kind: "gain-control-all", filter: ALL, untilEndOfTurn: true },
      { kind: "grant-keyword-all", filter: ALL, keyword: "haste", duration: "end-of-turn" },
    ],
  },
});
