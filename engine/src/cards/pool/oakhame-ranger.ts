import { defineCard } from "../define.js";

export default defineCard({
  name: "Oakhame Ranger",
  manaCost: "{G/W}{G/W}{G/W}{G/W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Knight", "Ranger"],
  power: 2,
  toughness: 2,
  text: "{T}: Creatures you control get +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{T}: Creatures you control get +1/+1 until end of turn.",
    },
  ],
  faces: ["Oakhame Ranger", "Bring Back"],
  adventure: true,
});
