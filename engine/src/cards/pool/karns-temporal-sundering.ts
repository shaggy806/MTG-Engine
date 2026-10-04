import { defineCard } from "../define.js";

// EDHREC rank 4086.
//
// Rulings:
//   [2018-04-27] If the target player or target nonland permanent is an illegal target as Karn's
//     Temporal Sundering resolves, the other target is affected as normal and Karn's Temporal
//     Sundering is exiled. If both targets are illegal, Karn's Temporal Sundering doesn't resolve
//     and isn't exiled.
// The legendary-sorcery restriction is Primevals' Glorious Rebirth's
// `castOnlyIf`; a fizzled spell goes to the graveyard, not exile
// (`exileOnResolve` only applies as it resolves).

export default defineCard({
  name: "Karn's Temporal Sundering",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["sorcery"],
  text: "(You may cast a legendary sorcery only if you control a legendary creature or planeswalker.)\nTarget player takes an extra turn after this one. Return up to one target nonland permanent to its owner's hand. Exile Karn's Temporal Sundering.",
  castOnlyIf: {
    kind: "controls",
    filter: { supertype: "legendary", typesAnyOf: ["creature", "planeswalker"] },
    atLeast: 1,
  },
  targets: ["player", { kind: "optional", of: "nonland-permanent" }],
  exileOnResolve: true,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "take-extra-turn", target: 0 },
      { kind: "return-to-hand", target: 1 },
    ],
  },
});
