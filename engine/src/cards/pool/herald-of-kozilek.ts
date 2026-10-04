import { defineCard } from "../define.js";

// EDHREC rank 6302.
//
// Devoid is `colors: []`. The reduction is generic only (`reduceGeneric`), as
// Eye of Ugin's colorless filter is.
//
// Rulings:
//   [2015-08-25] Herald of Kozilek's last ability can't reduce the amount of colored mana you pay
//     for a spell. It reduces only the generic component of that mana cost.
//   [2015-08-25] If there are additional costs to cast a spell, or if the cost to cast a spell is
//     increased by an effect, apply those increases before applying cost reductions.
//   [2015-08-25] The cost reduction can apply to alternative costs.
//   [2015-08-25] If a colorless spell you cast has {X} in its mana cost, you choose the value of X
//     before calculating the spell's total cost.
//   [2015-08-25] A card with devoid is just colorless. It's not colorless and the colors of mana
//     in its mana cost.
//   [2015-08-25] Herald of Kozilek's last ability doesn't change the mana cost or mana value of
//     any spell. It changes only the total cost you actually pay.

const COST_TEXT = "Colorless spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Herald of Kozilek",
  manaCost: "{1}{U}{R}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi", "Drone"],
  power: 2,
  toughness: 4,
  text: `Devoid (This card has no color.)\n${COST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { colorless: true }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
});
