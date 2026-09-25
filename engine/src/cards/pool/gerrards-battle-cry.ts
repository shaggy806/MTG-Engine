import { defineCard } from "../define.js";

export default defineCard({
  name: "Gerrard's Battle Cry",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "{2}{W}: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{W}: Creatures you control get +1/+1 until end of turn.",
    },
  ],
});
