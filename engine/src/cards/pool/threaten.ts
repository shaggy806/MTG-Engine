import { defineCard } from "../define.js";

export default defineCard({
  name: "Threaten",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Untap target creature and gain control of it until end of turn. That creature gains haste until end of turn.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-control", target: 0, untilEndOfTurn: true },
      { kind: "untap", target: 0 },
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
    ],
  },
});
