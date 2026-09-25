import { defineCard } from "../define.js";

export default defineCard({
  name: "Leonin Sun Standard",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{1}{W}: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{W}: Creatures you control get +1/+1 until end of turn.",
    },
  ],
});
