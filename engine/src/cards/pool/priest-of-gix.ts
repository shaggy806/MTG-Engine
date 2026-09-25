import { defineCard } from "../define.js";

export default defineCard({
  name: "Priest of Gix",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Human", "Cleric", "Minion"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, add {B}{B}{B}.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 3 },
      resolve: null,
      text: "When this creature enters, add {B}{B}{B}.",
    },
  ],
});
