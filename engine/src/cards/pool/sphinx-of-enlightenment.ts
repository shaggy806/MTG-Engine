import { defineCard } from "../define.js";

export default defineCard({
  name: "Sphinx of Enlightenment",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sphinx"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text:
    "Flying\n" +
    "When Sphinx of Enlightenment enters, target opponent draws a card and you " +
    "draw three cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1, target: 0 },
          { kind: "draw", amount: 3 },
        ],
      },
      resolve: null,
      text:
        "When Sphinx of Enlightenment enters, target opponent draws a card and you " +
        "draw three cards.",
    },
  ],
});
