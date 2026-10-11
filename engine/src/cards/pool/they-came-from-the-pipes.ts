import { defineCard } from "../define.js";

const DREAD_TEXT = "When this enchantment enters, manifest dread twice.";
const DRAW_TEXT = "Whenever a face-down creature you control enters, draw a card.";

// Manifest dread (rule 701.62a) twice, one after the other: each creature
// manifested enters face down, and draws.
export default defineCard({
  name: "They Came from the Pipes",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `${DREAD_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "manifest-dread", count: 2 },
      resolve: null,
      text: DREAD_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature", faceDown: true } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
