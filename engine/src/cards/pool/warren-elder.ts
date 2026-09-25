import { defineCard } from "../define.js";

export default defineCard({
  name: "Warren Elder",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Rabbit", "Cleric"],
  power: 2,
  toughness: 2,
  text: "{3}{W}: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{W}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{3}{W}: Creatures you control get +1/+1 until end of turn.",
    },
  ],
});
