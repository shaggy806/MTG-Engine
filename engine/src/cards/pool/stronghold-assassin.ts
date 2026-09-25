import { defineCard } from "../define.js";

export default defineCard({
  name: "Stronghold Assassin",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Zombie", "Assassin"],
  power: 2,
  toughness: 1,
  text: "{T}, Sacrifice a creature: Destroy target nonblack creature.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: ["nonblack-creature"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{T}, Sacrifice a creature: Destroy target nonblack creature.",
    },
  ],
});
