import { defineCard } from "../define.js";

export default defineCard({
  name: "Ravaging Horde",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, destroy target land.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target land.",
    },
  ],
});
