import { defineCard } from "../define.js";

export default defineCard({
  name: "Cat-Owl",
  manaCost: "{3}{W/U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Cat", "Bird"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, untap target artifact or creature.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["artifact-or-creature"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "Whenever this creature attacks, untap target artifact or creature.",
    },
  ],
});
