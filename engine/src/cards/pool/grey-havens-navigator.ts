import { defineCard } from "../define.js";

export default defineCard({
  name: "Grey Havens Navigator",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elf", "Pilot"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, scry 1.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "When this creature enters, scry 1.",
    },
  ],
});
