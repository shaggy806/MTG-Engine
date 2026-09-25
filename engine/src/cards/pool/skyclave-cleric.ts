import { defineCard } from "../define.js";

export default defineCard({
  name: "Skyclave Cleric",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kor", "Cleric"],
  power: 1,
  toughness: 3,
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
  faces: ["Skyclave Cleric", "Skyclave Basilica"],
});
