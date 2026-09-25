import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Lava",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 1,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\n{R}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
