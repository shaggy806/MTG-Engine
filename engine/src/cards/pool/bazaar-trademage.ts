import { defineCard } from "../define.js";

export default defineCard({
  name: "Bazaar Trademage",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, draw two cards, then discard three cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 3 }],
      },
      resolve: null,
      text: "When this creature enters, draw two cards, then discard three cards.",
    },
  ],
});
