import { defineCard } from "../define.js";

export default defineCard({
  name: "Barrier of Bones",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Skeleton", "Wall"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender\nWhen this creature enters, surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)",
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
