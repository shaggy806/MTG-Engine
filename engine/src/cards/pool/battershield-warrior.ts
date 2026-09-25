import { defineCard } from "../define.js";

export default defineCard({
  name: "Battershield Warrior",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 2,
  text: "Boast — {1}{W}: Creatures you control get +1/+1 until end of turn. (Activate only if this creature attacked this turn and only once each turn.)",
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
      text: "Boast — {1}{W}: Creatures you control get +1/+1 until end of turn.",
      boast: true,
    },
  ],
});
