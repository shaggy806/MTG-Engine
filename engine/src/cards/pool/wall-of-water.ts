import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Water",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 5,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\n{U}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
