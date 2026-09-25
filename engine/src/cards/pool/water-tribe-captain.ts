import { defineCard } from "../define.js";

export default defineCard({
  name: "Water Tribe Captain",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Ally"],
  power: 3,
  toughness: 3,
  text: "{5}: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{5}", tap: false },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{5}: Creatures you control get +1/+1 until end of turn.",
    },
  ],
});
