import { defineCard } from "../define.js";

export default defineCard({
  name: "Graf Mole",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Mole", "Beast"],
  power: 2,
  toughness: 4,
  text: "Whenever you sacrifice a Clue, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Clue" } },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "Whenever you sacrifice a Clue, you gain 3 life.",
    },
  ],
});
