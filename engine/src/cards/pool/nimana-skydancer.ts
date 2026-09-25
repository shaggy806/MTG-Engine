import { defineCard } from "../define.js";

export default defineCard({
  name: "Nimana Skydancer",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\nWhen this creature enters, target opponent mills two cards. (They put the top two cards of their library into their graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: { kind: "mill", target: 0, amount: 2 },
      resolve: null,
      text: "When this creature enters, target opponent mills two cards.",
    },
  ],
});
