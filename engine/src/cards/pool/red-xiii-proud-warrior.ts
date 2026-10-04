import { defineCard } from "../define.js";

// EDHREC rank 3834.
//
// Rulings:
//   [2025-06-06] A creature that is equipped is considered modified no matter who controls the
//     Equipment that's attached to it.
//   [2025-06-06] An Aura controlled by another player does not cause a creature you control to be
//     modified.
//   [2025-06-06] A creature with a counter on it is considered modified no matter what kind of
//     counter it is or which player put it on that creature.

export default defineCard({
  name: "Red XIII, Proud Warrior",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Beast", "Warrior"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance", "trample"],
  text: "Vigilance, trample\nOther modified creatures you control have vigilance and trample. (Equipment, Auras you control, and counters are modifications.)\nCosmo Memory — When Red XIII enters, return target Aura or Equipment card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { anyOf: [{ subtype: "Aura" }, { subtype: "Equipment" }] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "Cosmo Memory — When Red XIII enters, return target Aura or Equipment card from your graveyard to your hand.",
    },
  ],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", modified: true },
        excludeSelf: true,
      },
      grantKeywords: ["vigilance", "trample"],
      text: "Other modified creatures you control have vigilance and trample.",
    },
  ],
});
