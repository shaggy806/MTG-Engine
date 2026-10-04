import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 5539.
//
// Rulings:
//   [2023-06-16] If you cast a spell using Glamdring's triggered ability, you do so as part of the
//     resolution of the ability. You can't wait to cast the spell later in the turn. Timing
//     permissions based on the card's type are ignored.
//   [2023-06-16] If the spell has {X} in its mana cost, you must choose 0 as the value of X.
//   [2023-06-16] If you cast a spell "without paying its mana cost", you can't choose to cast it
//     for any alternative costs. You can, however, pay additional costs, such as kicker costs. If
//     the card has any mandatory additional costs, those must be paid to cast the spell.
//
// The bonus is Bonehoard's graveyard count on the equipped creature; the
// trigger is the Equipment's own (Dowsing Dagger's `who: "attached"`), its
// value the damage dealt, which bounds the free cast from hand
// (Electrodominance's `cast-now`, judged at X = 0 as the rulings say).

const STATIC_TEXT =
  "Equipped creature has first strike and gets +1/+0 for each instant and sorcery card in your graveyard.";
const TRIGGER_TEXT =
  "Whenever equipped creature deals combat damage to a player, you may cast an instant or sorcery spell from your hand with mana value less than or equal to that damage without paying its mana cost.";

export default defineCard({
  name: "Glamdring",
  manaCost: "{2}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\n${TRIGGER_TEXT}\nEquip {3}`,
  activated: [equip("{3}")],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["first-strike"],
      grantPtPerCount: {
        inGraveyard: { typesAnyOf: ["instant", "sorcery"], ownedBy: "you" },
        pt: [1, 0],
      },
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "cast-now",
        from: "hand",
        free: true,
        spell: {
          typesAnyOf: ["instant", "sorcery"],
          manaValue: { op: "lte", n: { amount: { triggerValue: true } } },
        },
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
