import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Denouncer",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Carrier"],
  power: 1,
  toughness: 1,
  text: "{T}, Sacrifice this creature: Target creature gets -1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{T}, Sacrifice this creature: Target creature gets -1/-1 until end of turn.",
    },
  ],
});
