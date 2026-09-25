import { defineCard } from "../define.js";

export default defineCard({
  name: "Homarid Explorer",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Homarid", "Scout"],
  power: 3,
  toughness: 3,
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
