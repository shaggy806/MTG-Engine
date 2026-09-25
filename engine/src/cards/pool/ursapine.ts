import { defineCard } from "../define.js";

export default defineCard({
  name: "Ursapine",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 3,
  toughness: 3,
  text: "{G}: Target creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: "{G}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{G}: Target creature gets +1/+1 until end of turn.",
    },
  ],
});
