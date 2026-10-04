import { defineCard } from "../define.js";

// EDHREC rank 4406.
// Jodah, Archmage Eternal's static, on an artifact.
//
// Rulings:
//   [2004-12-01] If you apply Fist of Suns's alternative cost to a spell with {X} in its mana
//     cost, X is 0.
//   [2004-12-01] You can't combine this with other alternative costs, such as flashback. You can
//     pay additional costs, such as kicker, in addition to this alternative cost.

const TEXT = "You may pay {W}{U}{B}{R}{G} rather than pay the mana cost for spells you cast.";

export default defineCard({
  name: "Fist of Suns",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  static: [{ affects: { scope: "self" }, alternativeCostForSpells: { mana: "{W}{U}{B}{R}{G}" }, text: TEXT }],
});
