import { defineCard } from "../define.js";

export default defineCard({
  name: "Blighted Shaman",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Cleric", "Shaman"],
  power: 1,
  toughness: 1,
  text: "{T}, Sacrifice a Swamp: Target creature gets +1/+1 until end of turn.\n{T}, Sacrifice a creature: Target creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Swamp" } } },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "{T}, Sacrifice a Swamp: Target creature gets +1/+1 until end of turn.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{T}, Sacrifice a creature: Target creature gets +2/+2 until end of turn.",
    },
  ],
});
