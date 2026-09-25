import { defineCard } from "../define.js";

export default defineCard({
  name: "Encampment Keeper",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 1,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\n{7}{W}, {T}, Sacrifice this creature: Creatures you control get +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: "{7}{W}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 2,
        toughness: 2,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{7}{W}, {T}, Sacrifice this creature: Creatures you control get +2/+2 until end of turn.",
    },
  ],
});
