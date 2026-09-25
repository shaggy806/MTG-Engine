import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Blood",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 2,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\nPay 1 life: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 1 },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Pay 1 life: This creature gets +1/+1 until end of turn.",
    },
  ],
});
