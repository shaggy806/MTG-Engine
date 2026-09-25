import { defineCard } from "../define.js";

export default defineCard({
  name: "Healer of the Glade",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 1,
  toughness: 2,
  text: "When this creature enters, you gain 3 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 3 },
      resolve: null,
      text: "When this creature enters, you gain 3 life.",
    },
  ],
});
