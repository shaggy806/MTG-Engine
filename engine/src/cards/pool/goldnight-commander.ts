import { defineCard } from "../define.js";

export default defineCard({
  name: "Goldnight Commander",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric", "Soldier"],
  power: 2,
  toughness: 2,
  text: "Whenever another creature you control enters, creatures you control get +1/+1 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever another creature you control enters, creatures you control get +1/+1 until end of turn.",
    },
  ],
});
