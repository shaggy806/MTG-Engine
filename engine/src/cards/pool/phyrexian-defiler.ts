import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Defiler",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Carrier"],
  power: 3,
  toughness: 3,
  text: "{T}, Sacrifice this creature: Target creature gets -3/-3 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
      resolve: null,
      text: "{T}, Sacrifice this creature: Target creature gets -3/-3 until end of turn.",
    },
  ],
});
