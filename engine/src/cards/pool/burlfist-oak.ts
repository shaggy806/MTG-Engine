import { defineCard } from "../define.js";

export default defineCard({
  name: "Burlfist Oak",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 2,
  toughness: 3,
  text: "Whenever you draw a card, this creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever you draw a card, this creature gets +2/+2 until end of turn.",
    },
  ],
});
