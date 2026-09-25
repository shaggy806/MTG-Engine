import { defineCard } from "../define.js";

export default defineCard({
  name: "Whisper Agent",
  manaCost: "{1}{U/B}{U/B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "When this creature enters, surveil 1.",
    },
  ],
});
