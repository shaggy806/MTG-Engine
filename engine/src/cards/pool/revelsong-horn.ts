import { defineCard } from "../define.js";

export default defineCard({
  name: "Revelsong Horn",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{1}, {T}, Tap an untapped creature you control: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: {
        mana: "{1}",
        tap: true,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" } },
      },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{1}, {T}, Tap an untapped creature you control: Target creature gets +1/+1 until end of turn.",
    },
  ],
});
