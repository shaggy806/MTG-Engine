import { defineCard } from "../define.js";

export default defineCard({
  name: "Akroan Phalanx",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance\n{2}{R}: Creatures you control get +1/+0 until end of turn.",
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
