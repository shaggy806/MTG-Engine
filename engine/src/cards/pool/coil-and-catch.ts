import { defineCard } from "../define.js";

// The Omen of Marang River Regent (rule 720).
export default defineCard({
  name: "Coil and Catch",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  subtypes: ["Omen"],
  text: "Draw three cards, then discard a card. (Then shuffle this card into its owner's library.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      { kind: "discard", target: "you", amount: 1 },
    ],
  },
  faces: ["Marang River Regent", "Coil and Catch"],
  omen: true,
});
