import { defineCard } from "../define.js";

// EDHREC rank 5961.
//
// Rulings:
//   [2021-09-24] Any enters-the-battlefield abilities of the copied creature will trigger when the
//     token enters the battlefield. Any "as [this creature] enters the battlefield" or "[this
//     creature] enters the battlefield with" abilities of the chosen creature will also work.
//   [2021-09-24] If the copied creature has {X} in its mana cost, X is considered to be 0.
//   [2021-09-24] If the copied creature is copying something else, then the token enters the
//     battlefield as whatever that creature copied, with the exceptions noted above.
//   [2021-09-24] If the copied creature is a token, the new token that's created copies the
//     original characteristics of that token as stated by the effect that created that token, with
//     the exceptions noted above.
//   [2021-09-24] Except for power, toughness, creature type, and color, the token copies exactly
//     what was printed on the original creature and nothing else (unless that permanent is copying
//     something else or it is a token; see below). It doesn't copy whether that creature is tapped
//     or untapped, whether it has any counters on it or Auras and Equipment attached to it, and so
//     on.
//   [2025-06-06] You must still follow any timing restrictions and permissions, including those
//     based on the card's type. For instance, you can cast a sorcery using flashback only when you
//     could normally cast a sorcery.
//   [2025-06-06] To determine the total cost of a spell, start with the mana cost or alternative
//     cost (such as a flashback cost) you're paying, add any cost increases, then apply any cost
//     reductions. The mana value of the spell is determined only by its mana cost, no matter what
//     the total cost to cast the spell was.
//   [2025-06-06] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.
//   [2025-06-06] "Flashback [cost]" means "You may cast this card from your graveyard if the
//     resulting spell is an instant or sorcery spell by paying [cost] rather than paying its mana
//     cost" and "If the flashback cost was paid, exile this card instead of putting it anywhere
//     else any time it would leave the stack."
//   [2025-06-06] If a card with flashback is put into your graveyard during your turn, you can
//     cast it if it's legal to do so before any other player can take any actions.
//   [2025-06-06] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//
// Cackling Counterpart's copy with The Scarab God's "except it's a 4/4 black
// Zombie" exceptions: `setSubtypes` replaces the creature types only, so a
// copied artifact creature keeps its artifact subtypes.
export default defineCard({
  name: "Croaking Counterpart",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["sorcery"],
  flashback: { cost: "{3}{G}{U}" },
  text: "Create a token that's a copy of target non-Frog creature, except it's a 1/1 green Frog.\nFlashback {3}{G}{U} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: [{ kind: "permanent", filter: { type: "creature", notSubtypes: ["Frog"] } }],
  effect: {
    kind: "create-token-copy",
    of: 0,
    count: 1,
    who: "you",
    exceptions: { basePt: [1, 1], setColors: ["G"], setSubtypes: ["Frog"] },
  },
});
