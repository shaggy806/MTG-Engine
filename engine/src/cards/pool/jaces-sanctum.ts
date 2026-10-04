import { defineCard } from "../define.js";

// EDHREC rank 4184.
//
// Rulings:
//   [2015-06-22] The first ability of Jace’s Sanctum can’t reduce the colored mana requirement of
//     an instant or sorcery spell.
//   [2015-06-22] Jace’s Sanctum’s scry ability will resolve before the instant or sorcery spell
//     that caused it to trigger.
//   [2015-06-22] If there are additional costs to cast an instant or sorcery spell, apply those
//     before applying cost reductions.
//   [2015-06-22] Jace’s Sanctum can reduce alternative costs such as miracle or overload costs.

const COST_TEXT = "Instant and sorcery spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Jace's Sanctum",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `${COST_TEXT}\nWhenever you cast an instant or sorcery spell, scry 1.`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["instant", "sorcery"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "Whenever you cast an instant or sorcery spell, scry 1.",
    },
  ],
});
