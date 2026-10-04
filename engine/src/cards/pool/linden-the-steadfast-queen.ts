import { defineCard } from "../define.js";

// EDHREC rank 6341.

export default defineCard({
  name: "Linden, the Steadfast Queen",
  manaCost: "{W}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance (Attacking doesn't cause this creature to tap.)\nWhenever a white creature you control attacks, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { type: "creature", colors: ["W"] } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever a white creature you control attacks, you gain 1 life.",
    },
  ],
});
