import { defineCard } from "../define.js";

export default defineCard({
  name: "Crenellated Wall",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\n{T}: Target creature gets +0/+4 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 0, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target creature gets +0/+4 until end of turn.",
    },
  ],
});
