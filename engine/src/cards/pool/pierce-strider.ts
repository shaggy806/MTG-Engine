import { defineCard } from "../define.js";

export default defineCard({
  name: "Pierce Strider",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Construct"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, target opponent loses 3 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: { kind: "lose-life", amount: 3, target: 0 },
      resolve: null,
      text: "When this creature enters, target opponent loses 3 life.",
    },
  ],
});
