import { defineCard } from "../define.js";

export default defineCard({
  name: "Nighthaze",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target creature gains swampwalk until end of turn. (It can't be blocked as long as defending player controls a Swamp.)\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "swampwalk", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});
