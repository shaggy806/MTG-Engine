import { defineCard } from "../define.js";

export default defineCard({
  name: "Screeching Phoenix",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Phoenix"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\n{2}{R}: Creatures you control get +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{R}: Creatures you control get +1/+0 until end of turn.",
    },
  ],
});
