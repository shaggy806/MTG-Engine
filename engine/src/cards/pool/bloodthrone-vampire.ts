import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodthrone Vampire",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 1,
  text: "Sacrifice a creature: Bloodthrone Vampire gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "modify-pt",
        target: "source",
        power: 2,
        toughness: 2,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Sacrifice a creature: Bloodthrone Vampire gets +2/+2 until end of turn.",
    },
  ],
});
