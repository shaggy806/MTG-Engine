import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Plaguelord",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Carrier"],
  power: 4,
  toughness: 4,
  text: "{T}, Sacrifice this creature: Target creature gets -4/-4 until end of turn.\nSacrifice a creature: Target creature gets -1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -4, toughness: -4, duration: "end-of-turn" },
      resolve: null,
      text: "{T}, Sacrifice this creature: Target creature gets -4/-4 until end of turn.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a creature: Target creature gets -1/-1 until end of turn.",
    },
  ],
});
