import { defineCard } from "../define.js";

// EDHREC rank 3291.
// Makes Treasure → use "Treasure Token".
//
// Rulings:
//   [2023-09-01] Only you get to look at the cards exiled with Expensive Taste. Their owner
//     doesn't get to know what they are while they're in exile until you play them.
//   [2023-09-01] If an effect copies an Adventure spell, that copy is exiled as it resolves. It
//     ceases to exist as a state-based action; it’s not possible to cast the copy as a permanent.
//   [2023-09-01] You may play the cards exiled with Expensive Taste even if they are land cards.
//   [2023-09-01] If an effect refers to a card, spell, or permanent that has an Adventure, it
//     won’t find an instant or sorcery spell on the stack that’s been cast as an Adventure.
//   [2023-09-01] If a spell is cast as an Adventure, its controller exiles it instead of putting
//     it into its owner’s graveyard as it resolves. For as long as it remains exiled, that player
//     may cast it as a permanent spell. If an Adventure spell leaves the stack in any way other
//     than resolving (most likely by being countered or by failing to resolve because its targets
//     have all become illegal), that card won’t be exiled and the spell’s controller won’t be able
//     to cast it as a permanent later.
//   [2023-09-01] If an object becomes a copy of an object that has an Adventure, the copy also has
//     an Adventure. If it changes zones, it will either cease to exist (if it’s a token) or cease
//     to be a copy (if it’s a nontoken permanent), and so you won’t be able to cast it as an
//     Adventure.
//   [2023-09-01] You must still follow all normal timing rules to play cards exiled with Expensive
//     Taste.
//   [2023-09-01] If you cast an adventurer card as an Adventure, use only its alternative
//     characteristics to determine whether it’s legal to cast that spell. For example, if you
//     control Johann, Apprentice Sorcerer (“Once each turn, you may cast an instant or sorcery
//     spell from the top of your library.”) and Questing Druid is on top of your library, you can
//     cast Seek the Beast, but not Questing Druid.
//   [2023-09-01] An effect may refer to a card, spell, or permanent that “has an Adventure.” This
//     refers to a card, spell, or permanent that has an adventurer card’s set of alternative
//     characteristics, even if they’re not being used and even if that card was never cast as an
//     Adventure.
//   [2023-09-01] Casting a card as an Adventure isn’t casting it for an alternative cost. Effects
//     that allow you to cast a spell for an alternative cost or without paying its mana cost may
//     allow you to apply those to the Adventure.
//   [2023-09-01] You must still follow any timing restrictions and permissions for the permanent
//     spell you cast from exile. Normally, you’ll be able to cast it only during your main phase
//     while the stack is empty.
//   [2023-09-01] If an adventurer card ends up in exile for any other reason than by exiling
//     itself while resolving, it won’t give you permission to cast it as a permanent spell.
//   [2023-09-01] When casting a spell as an Adventure, use the alternative characteristics and
//     ignore all of the card’s normal characteristics. The spell’s color, mana cost, mana value,
//     and so on are determined by only those alternative characteristics. If the spell leaves the
//     stack, it immediately resumes using its normal characteristics.
//   [2023-09-01] An adventurer card is a permanent card in every zone except the stack, as well as
//     while on the stack if not cast as an Adventure. Ignore its alternative characteristics in
//     those cases. For example, while it’s in your graveyard, Questing Druid is a green creature
//     card whose mana value is 2. It can’t be the target of Tenacious Tomeseeker’s triggered
//     ability (“return target instant or sorcery card from your graveyard to your hand”).
//   [2023-09-01] If an effect instructs you to choose a card name, you may choose the alternative
//     Adventure name. Consider only the alternative characteristics to determine whether that is
//     an appropriate name to choose.

export default defineCard({
  name: "Decadent Dragon",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "trample"],
  text: "Flying, trample\nWhenever this creature attacks, create a Treasure token.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Whenever this creature attacks, create a Treasure token.",
    },
  ],
  faces: ["Decadent Dragon", "Expensive Taste"],
  adventure: true,
});
