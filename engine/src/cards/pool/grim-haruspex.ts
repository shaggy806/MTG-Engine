import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever another nontoken creature you control dies, draw a card.";

// Morph {B} (rule 702.37). Face down it has no abilities, so its own trigger
// isn't there to see a creature die until it's turned face up.
export default defineCard({
  name: "Grim Haruspex",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 2,
  text: `Morph {B}\n${DRAW_TEXT}`,
  morph: { keyword: "morph", cost: "{B}" },
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature", token: false }, otherOnly: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
