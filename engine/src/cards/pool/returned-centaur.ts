import { defineCard } from "../define.js";

export default defineCard({
  name: "Returned Centaur",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Centaur"],
  power: 2,
  toughness: 4,
  text: "When this creature enters, target player mills four cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 4 },
      resolve: null,
      text: "When this creature enters, target player mills four cards.",
    },
  ],
});
