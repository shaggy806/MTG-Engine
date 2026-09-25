import { defineCard } from "../define.js";

export default defineCard({
  name: "Dawnwing Marshal",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{4}{W}: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{4}{W}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{4}{W}: Creatures you control get +1/+1 until end of turn.",
    },
  ],
});
