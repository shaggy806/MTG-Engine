import { defineCard } from "../define.js";

export default defineCard({
  name: "Mandroid Squadron",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Human", "Soldier"],
  power: 0,
  toughness: 4,
  text: "When this creature enters, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "When this creature enters, you gain 2 life.",
    },
  ],
});
