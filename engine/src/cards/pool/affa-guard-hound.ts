import { defineCard } from "../define.js";

export default defineCard({
  name: "Affa Guard Hound",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nWhen this creature enters, target creature gets +0/+3 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 0, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets +0/+3 until end of turn.",
    },
  ],
});
