import { defineCard } from "../define.js";

export default defineCard({
  name: "Selfless Cathar",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "{1}{W}, Sacrifice this creature: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{W}, Sacrifice this creature: Creatures you control get +1/+1 until end of turn.",
    },
  ],
});
