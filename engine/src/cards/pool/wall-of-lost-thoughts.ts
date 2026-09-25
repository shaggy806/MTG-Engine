import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Lost Thoughts",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\nWhen this creature enters, target player mills four cards. (They put the top four cards of their library into their graveyard.)",
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
