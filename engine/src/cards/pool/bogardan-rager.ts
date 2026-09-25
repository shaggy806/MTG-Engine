import { defineCard } from "../define.js";

export default defineCard({
  name: "Bogardan Rager",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 4,
  keywords: ["flash"],
  text: "Flash (You may cast this spell any time you could cast an instant.)\nWhen this creature enters, target creature gets +4/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 4, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets +4/+0 until end of turn.",
    },
  ],
});
