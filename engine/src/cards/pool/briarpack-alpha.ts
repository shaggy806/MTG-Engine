import { defineCard } from "../define.js";

export default defineCard({
  name: "Briarpack Alpha",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 3,
  toughness: 3,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nWhen this creature enters, target creature gets +2/+2 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets +2/+2 until end of turn.",
    },
  ],
});
