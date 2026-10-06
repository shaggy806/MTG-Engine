import { defineCard } from "../define.js";

// EDHREC rank 6456.
//
// Rulings:
//   [2022-06-10] If a spell is cast as an Adventure, its controller exiles it instead of putting
//     it into its owner’s graveyard as it resolves. For as long as it remains exiled, that player
//     may cast it as a permanent spell. If an Adventure spell leaves the stack in any way other
//     than resolving (most likely by being countered or by failing to resolve because its targets
//     have all become illegal), that card won’t be exiled and the spell’s controller won’t be able
//     to cast it as a permanent later.
//   [2022-06-10] An adventurer card is a permanent card in every zone except the stack, as well as
//     while on the stack if not cast as an Adventure. Ignore its alternative characteristics in
//     those cases. For example, while it’s in your graveyard, Altar of Bhaal is an artifact card
//     whose mana value is 2.
//   [2022-06-10] If an effect instructs you to choose a card name, you may choose the alternative
//     Adventure name. Consider only the alternative characteristics to determine whether that is
//     an appropriate name to choose.
//   [2022-06-10] When casting a spell as an Adventure, use the alternative characteristics and
//     ignore all of the card’s normal characteristics. The spell’s color, mana cost, mana value,
//     and so on are determined by only those alternative characteristics. If the spell leaves the
//     stack, it immediately resumes using its normal characteristics.
//   [2022-06-10] If an object becomes a copy of an object that has an Adventure, the copy also has
//     an Adventure. If it changes zones, it will either cease to exist (if it’s a token) or cease
//     to be a copy (if it’s a nontoken permanent), and so you won’t be able to cast it as an
//     Adventure.
//   [2022-06-10] If an effect copies an Adventure spell, that copy is exiled as it resolves. It
//     ceases to exist as a state-based action; it’s not possible to cast the copy from exile.
//   [2022-06-10] An effect may refer to a card, spell, or permanent that “has an Adventure.” This
//     refers to a card, spell, or permanent that has an adventurer card’s set of alternative
//     characteristics, even if they’re not being used and even if that card was never cast as an
//     Adventure.
//   [2022-06-10] If an adventurer card ends up in exile for any other reason than by exiling
//     itself while resolving, it won’t give you permission to cast it as a permanent spell.
//   [2022-06-10] Casting a noncreature spell after Sword Coast Serpent has become blocked will not
//     cause it to become unblocked.
//   [2022-06-10] Casting a card as an Adventure isn’t casting it for an alternative cost. Effects
//     that allow you to cast a spell for an alternative cost or without paying its mana cost may
//     allow you to apply those to the Adventure.
//   [2022-06-10] You must still follow any relevant timing rules for the permanent spell you cast
//     from exile. Normally, you’ll be able to cast it only during your main phase while the stack
//     is empty.
//   [2022-06-10] If you cast an adventurer card as an Adventure, use only its alternative
//     characteristics to determine whether it’s legal to cast that spell.

export default defineCard({
  name: "Sword Coast Serpent",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Serpent", "Dragon"],
  power: 6,
  toughness: 6,
  text: "This creature can't be blocked as long as you've cast a noncreature spell this turn.",
  static: [
    {
      // Each spell read as it was cast — Capsizing Wave counts (it's an instant).
      affects: { scope: "self" },
      condition: { kind: "cast-this-turn", filter: { notTypes: ["creature"] } },
      grantKeywords: ["unblockable"],
      text: "This creature can't be blocked as long as you've cast a noncreature spell this turn.",
    },
  ],
  faces: ["Sword Coast Serpent", "Capsizing Wave"],
  adventure: true,
});
