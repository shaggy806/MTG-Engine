import { defineCard } from "../define.js";

const CYCLE_TEXT = "When you cycle this card, put a trample counter on target creature you control.";

// A trample counter is a keyword counter (rule 122.1b): the creature has
// trample for as long as it's there.
export default defineCard({
  name: "Titanoth Rex",
  manaCost: "{7}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur", "Beast"],
  power: 11,
  toughness: 11,
  keywords: ["trample"],
  cycling: { cost: "{1}{G}" },
  text: `Trample\nCycling {1}{G} ({1}{G}, Discard this card: Draw a card.)\n${CYCLE_TEXT}`,
  triggered: [
    {
      trigger: { on: "this-cycled" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "trample", amount: 1 },
      resolve: null,
      text: CYCLE_TEXT,
    },
  ],
});
