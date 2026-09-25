import { defineCard } from "../define.js";

export default defineCard({
  name: "Flayed One",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Necron"],
  power: 4,
  toughness: 1,
  keywords: ["lifelink"],
  text: "Lifelink\nFlesh Flayer — When this creature enters, mill three cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: "Flesh Flayer — When this creature enters, mill three cards.",
    },
  ],
});
