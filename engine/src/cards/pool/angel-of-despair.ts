import { defineCard } from "../define.js";

export default defineCard({
  name: "Angel of Despair",
  manaCost: "{3}{W}{W}{B}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, destroy target permanent.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target permanent.",
    },
  ],
});
