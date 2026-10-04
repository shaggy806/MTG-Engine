import { defineCard } from "../define.js";

// EDHREC rank 3954.
//
// Arboreal Grazer's "you may put a land card from your hand onto the
// battlefield tapped", with the six-enchantments check made as the ability
// resolves.
const TEXT =
  "Constellation — Whenever an enchantment you control enters, you may put a land card from your hand onto the battlefield tapped. If you control six or more enchantments, instead you may put a creature or land card from your hand onto the battlefield tapped.";

export default defineCard({
  name: "Composer of Spring",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Satyr", "Bard"],
  power: 1,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "controls", filter: { type: "enchantment" }, atLeast: 6 },
        then: {
          kind: "look-and-choose",
          zone: "hand",
          min: 0,
          max: 1,
          destination: "battlefield",
          enterTapped: true,
          leftover: "stay",
          filter: { typesAnyOf: ["creature", "land"] },
        },
        else: {
          kind: "look-and-choose",
          zone: "hand",
          min: 0,
          max: 1,
          destination: "battlefield",
          enterTapped: true,
          leftover: "stay",
          filter: { type: "land" },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
