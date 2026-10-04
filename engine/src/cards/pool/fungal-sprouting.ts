import { defineCard } from "../define.js";

// EDHREC rank 5664.
//
// Rulings:
//   [2012-07-01] Fungal Sprouting doesn't target any creature. The greatest power among creatures
//     you control is determined when Fungal Sprouting resolves.
export default defineCard({
  name: "Fungal Sprouting",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Create X 1/1 green Saproling creature tokens, where X is the greatest power among creatures you control.",
  effect: {
    kind: "create-token",
    token: "Saproling Token",
    count: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
  },
});
