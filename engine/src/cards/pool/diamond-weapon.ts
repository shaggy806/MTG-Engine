import { defineCard } from "../define.js";

// EDHREC rank 5218.
//
// Rulings:
//   [2025-06-06] Diamond Weapon's prevention effect isn't considered while assigning combat damage
//     from a creature with trample that's being blocked by Diamond Weapon. For example, if it
//     blocks a 12/12 creature with trample, that creature's controller must assign at least 8 of
//     that creature's combat damage to Diamond Weapon, and the remainder can be assigned to the
//     defending player, planeswalker, or battle.

export default defineCard({
  name: "Diamond Weapon",
  manaCost: "{7}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Elemental"],
  power: 8,
  toughness: 8,
  keywords: ["reach"],
  text: "This spell costs {1} less to cast for each permanent card in your graveyard.\nReach\nImmune — Prevent all combat damage that would be dealt to Diamond Weapon.",
  // Karador's shape. A permanent card is one that isn't an instant or a
  // sorcery (Aether Helix's "permanent card" filter).
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { cardsInGraveyard: { notTypes: ["instant", "sorcery"] } },
  },
  static: [
    {
      // Fog Bank's first half.
      affects: { scope: "self" },
      replacement: { event: "would-deal-damage", combat: true, prevent: true, to: "self" },
      text: "Immune — Prevent all combat damage that would be dealt to Diamond Weapon.",
    },
  ],
});
