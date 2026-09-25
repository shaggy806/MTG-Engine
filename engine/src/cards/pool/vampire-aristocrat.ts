import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire Aristocrat",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Rogue", "Noble"],
  power: 2,
  toughness: 2,
  text: "Sacrifice a creature: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a creature: This creature gets +2/+2 until end of turn.",
    },
  ],
});
