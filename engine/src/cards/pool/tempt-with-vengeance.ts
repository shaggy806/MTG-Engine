import { defineCard } from "../define.js";

const ELEMENTALS = { kind: "create-token", token: "Elemental Token", count: "x" } as const;

// Tempting offer: each opponent decides in turn, and each who takes it makes
// their own Elementals and gives you X more.
export default defineCard({
  name: "Tempt with Vengeance",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "Tempting offer — Create X 1/1 red Elemental creature tokens with haste. Each opponent may create X 1/1 red Elemental creature tokens with haste. For each opponent who does, create X 1/1 red Elemental creature tokens with haste.",
  effect: {
    kind: "sequence",
    effects: [
      ELEMENTALS,
      {
        kind: "each-player-may",
        who: "each-opponent",
        prompt: "Create X 1/1 red Elemental creature tokens with haste?",
        effect: ELEMENTALS,
        ifDid: ELEMENTALS,
      },
    ],
  },
});
