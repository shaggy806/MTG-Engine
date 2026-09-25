import { defineCard } from "../define.js";

export default defineCard({
  name: "Priest of Urabrask",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Human", "Cleric"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, add {R}{R}{R}.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 3 },
      resolve: null,
      text: "When this creature enters, add {R}{R}{R}.",
    },
  ],
});
