import { defineCard } from "../define.js";

// EDHREC rank 5689.
// Makes Zombie Berserker → new token "Zombie Berserker Token" (scaffolded).
//
// Rulings:
//   [2021-02-05] The number of nontoken creatures that died that turn is counted as Rise of the
//     Dread Marn is resolving. In other words, nontoken creatures that die in response to Rise of
//     the Dread Marn will count.
//   [2021-02-05] If you’re casting a foretold card from exile for its foretell cost, you can’t
//     choose to cast it for any other alternative costs. You can, however, pay additional costs,
//     such as kicker costs. If the card has any mandatory additional costs, those must be paid to
//     cast the spell.
//   [2021-02-05] Casting a foretold card from exile follows the timing rules for that card. If you
//     foretell an instant card, you can cast it as soon as the next player’s turn. In most cases,
//     if you foretell a card that isn’t an instant (or doesn’t have flash), you’ll have to wait
//     until your next turn to cast it.
//   [2021-02-05] Because exiling a card with foretell from your hand is a special action, you can
//     do so any time you have priority during your turn, including in response to spells and
//     abilities. Once you announce you’re taking the action, no other player can respond by trying
//     to remove the card from your hand.
//   [2021-02-05] It doesn’t matter if the cards that represented those creatures are still in the
//     graveyard as Rise of the Dread Marn resolves. They’ll still count as long as they died that
//     turn.

export default defineCard({
  name: "Rise of the Dread Marn",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Create X 2/2 black Zombie Berserker creature tokens, where X is the number of nontoken creatures that died this turn.\nForetell {B} (During your turn, you may pay {2} and exile this card from your hand face down. Cast it on a later turn for its foretell cost.)",
  foretell: { cost: "{B}" },
  // Gadrak, the Crown-Scourge's count: every player's nontoken creatures
  // that died this turn, read as it resolves (the ruling).
  effect: {
    kind: "create-token",
    token: "Zombie Berserker Token",
    count: { turnHistory: "died", who: "each-player", filter: { token: false } },
  },
});
