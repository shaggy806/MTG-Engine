import { defineCard } from "../define.js";

// EDHREC rank 6453.
//
// Rulings:
//   [2019-05-03] Huatli’s first ability doesn’t actually change any creature’s power. It changes
//     only the amount of combat damage it assigns. All other rules and effects that check power or
//     toughness use the real values. For example, Domri’s Ambush won’t cause a creature to deal
//     damage equal to its toughness.
//   [2019-05-03] The greatest toughness among creatures you control is determined only as Huatli’s
//     loyalty ability begins to resolve.

export default defineCard({
  name: "Huatli, the Sun's Heart",
  manaCost: "{2}{G/W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Huatli"],
  loyalty: 7,
  text: "Each creature you control assigns combat damage equal to its toughness rather than its power.\n−3: You gain life equal to the greatest toughness among creatures you control.",
  activated: [
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      // Read as it resolves (the ruling); no creatures is 0 (Last March of the Ents' amount).
      effect: {
        kind: "gain-life",
        amount: { aggregate: "max", of: "toughness", filter: { type: "creature", controlledBy: "you" } },
      },
      resolve: null,
      text: "−3: You gain life equal to the greatest toughness among creatures you control.",
    },
  ],
  static: [
    {
      // High Alert's static. Only the damage assigned changes, never power (the ruling).
      affects: { scope: "creatures-you-control" },
      combatDamageByToughness: "always",
      text: "Each creature you control assigns combat damage equal to its toughness rather than its power.",
    },
  ],
});
