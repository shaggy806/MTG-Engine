import { defineCard } from "../define.js";

export default defineCard({
  name: "Thunder Wall",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 2,
  keywords: ["defender", "flying"],
  text: "Defender (This creature can't attack.)\nFlying\n{U}: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{U}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{U}: This creature gets +1/+1 until end of turn.",
    },
  ],
});
