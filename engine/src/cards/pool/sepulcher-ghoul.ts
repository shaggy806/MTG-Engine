import { defineCard } from "../define.js";

export default defineCard({
  name: "Sepulcher Ghoul",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 1,
  text: "Sacrifice another creature: This creature gets +2/+2 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice another creature: This creature gets +2/+2 until end of turn. Activate only once each turn.",
      otherOnly: true,
      oncePerTurn: true,
    },
  ],
});
