import { defineCard } from "../define.js";

// Top-commanders rank 202. "They lose 2 life" is whoever drew: the
// `"trigger-controller"` scope, which reaches them without targeting.
export default defineCard({
  name: "Sheoldred, the Apocalypse",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Praetor"],
  power: 4,
  toughness: 5,
  keywords: ["deathtouch"],
  text:
    "Deathtouch\n" +
    "Whenever you draw a card, you gain 2 life.\n" +
    "Whenever an opponent draws a card, they lose 2 life.",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Whenever you draw a card, you gain 2 life.",
    },
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: "Whenever an opponent draws a card, they lose 2 life.",
    },
  ],
});
