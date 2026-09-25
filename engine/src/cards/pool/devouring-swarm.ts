import { defineCard } from "../define.js";

export default defineCard({
  name: "Devouring Swarm",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nSacrifice a creature: This creature gets +1/+1 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a creature: This creature gets +1/+1 until end of turn.",
    },
  ],
});
