import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Debaser",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Carrier"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{T}, Sacrifice this creature: Target creature gets -2/-2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "{T}, Sacrifice this creature: Target creature gets -2/-2 until end of turn.",
    },
  ],
});
