import { defineCard } from "../define.js";

// EDHREC rank 2675.
//
// Rulings:
//   [2017-11-17] A nonland permanent card is an artifact, creature, enchantment, or planeswalker
//     card.
//   [2017-11-17] If you have fewer than X cards in your library, you reveal all of them.
//   [2017-11-17] If you put an Aura onto the battlefield this way, you choose what it enchants as
//     it enters the battlefield. This doesn't target any permanent or player, but it must be able
//     to enchant that permanent or player. For example, you could put a green Aura onto the
//     battlefield enchanting a creature with hexproof controlled by an opponent, but not one with
//     protection from green.
//   [2017-11-17] Genesis Hydra's first ability will resolve before Genesis Hydra does. Notably, if
//     you put an Aura card onto the battlefield this way, it can't enchant Genesis Hydra.
//   [2017-11-17] If "the rest" is zero cards, either because X was 0 or because X was 1 and that
//     card was put onto the battlefield, the library is still shuffled.
//   [2017-11-17] If a card in a player's library has {X} in its mana cost, X is considered to be
//     0.

const CAST_TEXT =
  "When you cast this spell, reveal the top X cards of your library. You may put a nonland permanent card with " +
  "mana value X or less from among them onto the battlefield. Then shuffle the rest into your library.";
const ENTER_TEXT = "This creature enters with X +1/+1 counters on it.";

// The cast trigger resolves before the spell and reads the X chosen as it
// was cast (Hydroid Krasis's shape). A card in the library with {X} has mana
// value 0 there. The rest stay on top until the shuffle, which happens even
// when there's nothing left to shuffle back (the ruling).
export default defineCard({
  name: "Genesis Hydra",
  manaCost: "{X}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Hydra"],
  power: 0,
  toughness: 0,
  text: `${CAST_TEXT}\n${ENTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "look-and-choose",
            zone: "library",
            count: "x",
            reveal: true,
            min: 0,
            max: 1,
            destination: "battlefield",
            leftover: "stay",
            filter: {
              typesAnyOf: ["artifact", "creature", "enchantment", "planeswalker", "battle"],
              notTypes: ["land"],
              manaValue: { op: "lte", n: { amount: "x" } },
            },
          },
          { kind: "shuffle-library" },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: "x" } },
      text: ENTER_TEXT,
    },
  ],
});
