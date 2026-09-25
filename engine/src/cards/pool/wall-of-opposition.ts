import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Opposition",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 6,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\n{1}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{1}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
