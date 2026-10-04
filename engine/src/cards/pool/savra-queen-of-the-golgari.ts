import { defineCard } from "../define.js";

// EDHREC rank 6041.
//
// Rulings:
//   [2024-01-12] Savra itself doesn't let you sacrifice creatures. Its abilities trigger whenever
//     you sacrifice a black or green creature because some other spell, ability, or cost
//     instructed you to do so.
//   [2024-01-12] Sacrificing a creature that's both black and green will make both abilities
//     trigger. You may put them on the stack in whichever order you want.

export default defineCard({
  name: "Savra, Queen of the Golgari",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 2,
  text: "Whenever you sacrifice a black creature, you may pay 2 life. If you do, each other player sacrifices a creature of their choice.\nWhenever you sacrifice a green creature, you may gain 2 life.",
  // The sacrificed creature is read as it last existed — Savra itself
  // included (a leaves-the-battlefield trigger looks back, rule 603.10a). A
  // black-green creature fires both, in the order its controller picks.
  // "Each other player" is each opponent: the engine has no teams.
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "creature", colors: ["B"] } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay 2 life to have each other player sacrifice a creature?",
        costLife: 2,
        effect: { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
      },
      resolve: null,
      text: "Whenever you sacrifice a black creature, you may pay 2 life. If you do, each other player sacrifices a creature of their choice.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "creature", colors: ["G"] } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 2 life?", effect: { kind: "gain-life", amount: 2 } },
      resolve: null,
      text: "Whenever you sacrifice a green creature, you may gain 2 life.",
    },
  ],
});
