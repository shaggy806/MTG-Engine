import { defineCard } from "../define.js";

export default defineCard({
  name: "Arborback Stomper",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 5,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, you gain 5 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 5 },
      resolve: null,
      text: "When this creature enters, you gain 5 life.",
    },
  ],
});
