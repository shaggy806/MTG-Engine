import { defineCard } from "../define.js";

export default defineCard({
  name: "Excavation Mole",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Mole"],
  power: 3,
  toughness: 3,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, mill three cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 3 },
      resolve: null,
      text: "When this creature enters, mill three cards.",
    },
  ],
});
