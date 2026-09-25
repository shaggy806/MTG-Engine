import { defineCard } from "../define.js";

export default defineCard({
  name: "Fallen Angel",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nSacrifice a creature: This creature gets +2/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a creature: This creature gets +2/+1 until end of turn.",
    },
  ],
});
