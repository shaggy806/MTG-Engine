import { defineCard } from "../define.js";

export default defineCard({
  name: "Hashep Oasis",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "{T}: Add {C}.\n{T}, Pay 1 life: Add {G}.\n{1}{G}{G}, {T}, Sacrifice a Desert: Target creature gets +3/+3 until end of turn. Activate only as a sorcery.",
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
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add {G}.",
    },
    {
      cost: { mana: "{1}{G}{G}", tap: true, sacrifice: { filter: { subtype: "Desert" } } },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{G}{G}, {T}, Sacrifice a Desert: Target creature gets +3/+3 until end of turn. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
