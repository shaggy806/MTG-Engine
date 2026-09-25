import { defineCard } from "../define.js";

export default defineCard({
  name: "Shefet Dunes",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\n{T}, Pay 1 life: Add {W}.\n{2}{W}{W}, {T}, Sacrifice a Desert: Creatures you control get +1/+1 until end of turn. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add {W}.",
    },
    {
      cost: { mana: "{2}{W}{W}", tap: true, sacrifice: { filter: { subtype: "Desert" } } },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: 1,
        toughness: 1,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{2}{W}{W}, {T}, Sacrifice a Desert: Creatures you control get +1/+1 until end of turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
