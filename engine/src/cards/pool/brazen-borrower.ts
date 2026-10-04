import { defineCard } from "../define.js";

// EDHREC rank 2679.
//
// Rulings:
//   [2025-06-06] If an effect copies an Adventure spell, that copy is exiled as it resolves. It
//     ceases to exist as a state-based action; it's not possible to play the copy as a permanent.
//   [2025-06-06] An adventurer card uses only its non-Adventure characteristics in every zone
//     except the stack, as well as while on the stack if not cast as an Adventure. Ignore its
//     alternative characteristics in those cases. For example, while it's in your graveyard,
//     Jidoor, Aristocratic Capital is a colorless Town land card whose mana value is 0. It can't
//     be the target of Sorceress's Schemes, which reads in part "Return target instant or sorcery
//     card from your graveyard or exiled card with flashback you own to your hand."
//   [2025-06-06] If an object becomes a copy of an object that has an Adventure, the copy also has
//     an Adventure. If it changes zones, it will either cease to exist (if it's a token) or cease
//     to be a copy (if it's a nontoken permanent), and so you won't be able to cast it as an
//     Adventure.
//   [2025-06-06] An effect may refer to a card, spell, or permanent that "has an Adventure." This
//     refers to a card, spell, or permanent that has an adventurer card's set of alternative
//     characteristics, even if they're not being used and even if that card was never cast as an
//     Adventure.
//   [2025-06-06] Casting a card as an Adventure isn't casting it for an alternative cost. Effects
//     that allow you to cast a spell for an alternative cost or without paying its mana cost may
//     allow you to apply those to the Adventure.
//   [2025-06-06] If you cast an adventurer card as an Adventure, use only its alternative
//     characteristics to determine whether it's legal to cast that spell. For example, if you
//     control Traveling Chocobo ("You may play lands and cast Bird spells from the top of your
//     library.") and Jidoor, Aristocratic Capital is on top of your library, you can play Jidoor,
//     Aristocratic Capital, but you can't cast Overture.
//   [2025-06-06] You must still follow any timing restrictions and permissions for the card you
//     play from exile. In the case of any of the five lands in this release, you'll be able to
//     play it only during your main phase while the stack is empty and only if you have an
//     available land play remaining.
//   [2025-06-06] If a spell is cast as an Adventure, its controller exiles it instead of putting
//     it into its owner's graveyard as it resolves. For as long as it remains exiled, that player
//     may play it using its primary characteristics. If an Adventure spell leaves the stack in any
//     way other than resolving (most likely by being countered or by failing to resolve because
//     its targets have all become illegal), that card won't be exiled and the spell's controller
//     won't be able to play that card from exile later.
//   [2025-06-06] If an effect refers to a card, spell, or permanent that has an Adventure, it
//     won't find an instant or sorcery spell on the stack that's been cast as an Adventure.
//   [2025-06-06] When playing a card as an Adventure, use the alternative characteristics and
//     ignore all of the card's normal characteristics. The resulting spell's color, mana cost,
//     mana value, and so on are determined by only those alternative characteristics. If the spell
//     leaves the stack, it immediately resumes using its normal characteristics.
//   [2025-06-06] If an adventurer card ends up in exile for any other reason than by exiling
//     itself while resolving, it won't give you permission to play it with its primary
//     characteristics.
//   [2025-06-06] If an effect instructs you to choose a card name, you may choose the alternative
//     Adventure name. Consider only the alternative characteristics to determine whether that is
//     an appropriate name to choose.

export default defineCard({
  name: "Brazen Borrower",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 3,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\nThis creature can block only creatures with flying.",
  static: [
    {
      affects: { scope: "self" },
      canBlockOnly: { keyword: "flying" },
      text: "This creature can block only creatures with flying.",
    },
  ],
  faces: ["Brazen Borrower", "Petty Theft"],
  adventure: true,
});
