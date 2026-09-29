import { defineCard } from "../define.js";

export default defineCard({
  name: "Mulldrifter",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  evoke: { cost: "{2}{U}" },
  text:
    "Flying\nWhen this creature enters, draw two cards.\nEvoke {2}{U} (You may cast this spell for its evoke cost. " +
    "If you do, it's sacrificed when it enters.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "When this creature enters, draw two cards.",
    },
  ],
});
