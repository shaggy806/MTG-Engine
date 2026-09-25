import { defineCard } from "../define.js";

export default defineCard({
  name: "Desolation Twin",
  manaCost: "{10}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 10,
  toughness: 10,
  text: "When you cast this spell, create a 10/10 colorless Eldrazi creature token.",
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Token", count: 1 },
      resolve: null,
      text: "When you cast this spell, create a 10/10 colorless Eldrazi creature token.",
    },
  ],
});
