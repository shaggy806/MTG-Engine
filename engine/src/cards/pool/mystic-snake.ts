import { defineCard } from "../define.js";

export default defineCard({
  name: "Mystic Snake",
  manaCost: "{1}{G}{U}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, counter target spell.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["spell"],
      effect: { kind: "counter", target: 0 },
      resolve: null,
      text: "When this creature enters, counter target spell.",
    },
  ],
});
