import { defineCard } from "../define.js";

// EDHREC rank 6181.
//
// Rulings:
//   [2018-04-27] You can't cast a legendary sorcery unless you control a legendary creature or a
//     legendary planeswalker. Once you begin to cast a legendary sorcery, losing control of your
//     legendary creatures and planeswalkers won't affect that spell.
// Karn's Temporal Sundering's legendary-sorcery shape.

export default defineCard({
  name: "Yawgmoth's Vile Offering",
  manaCost: "{4}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["sorcery"],
  text: "(You may cast a legendary sorcery only if you control a legendary creature or planeswalker.)\nPut up to one target creature or planeswalker card from a graveyard onto the battlefield under your control. Destroy up to one target creature or planeswalker. Exile Yawgmoth's Vile Offering.",
  castOnlyIf: {
    kind: "controls",
    filter: { supertype: "legendary", typesAnyOf: ["creature", "planeswalker"] },
    atLeast: 1,
  },
  targets: [
    {
      kind: "optional",
      of: { kind: "card-in-graveyard", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } },
    },
    {
      kind: "optional",
      of: { kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } },
    },
  ],
  exileOnResolve: true,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      { kind: "destroy", target: 1 },
    ],
  },
});
