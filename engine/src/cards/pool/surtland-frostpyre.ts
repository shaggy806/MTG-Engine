import { defineCard } from "../define.js";

export default defineCard({
  name: "Surtland Frostpyre",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {R}.\n{2}{U}{U}{R}, {T}, Sacrifice this land: Scry 2. This land deals 2 damage to each creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: "{2}{U}{U}{R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "scry", amount: 2 },
          { kind: "damage-all", amount: 2, filter: { type: "creature" } },
        ],
      },
      resolve: null,
      text: "{2}{U}{U}{R}, {T}, Sacrifice this land: Scry 2. This land deals 2 damage to each creature. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
