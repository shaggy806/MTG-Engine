import { defineCard } from "../define.js";

export default defineCard({
  name: "Mossbeard Ancient",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 7,
  toughness: 7,
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
