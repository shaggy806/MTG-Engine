import { defineCard } from "../define.js";

export default defineCard({
  name: "Maw of the Obzedat",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Thrull"],
  power: 3,
  toughness: 3,
  text: "Sacrifice a creature: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Sacrifice a creature: Creatures you control get +1/+1 until end of turn.",
    },
  ],
});
