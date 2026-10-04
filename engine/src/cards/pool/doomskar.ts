import { defineCard } from "../define.js";

// EDHREC rank 4855.
//
// Rulings:
//   [2021-02-05] Casting a foretold card from exile follows the timing rules for that card. If you
//     foretell an instant card, you can cast it as soon as the next player’s turn. In most cases,
//     if you foretell a card that isn’t an instant (or doesn’t have flash), you’ll have to wait
//     until your next turn to cast it.
//   [2021-02-05] Because exiling a card with foretell from your hand is a special action, you can
//     do so any time you have priority during your turn, including in response to spells and
//     abilities. Once you announce you’re taking the action, no other player can respond by trying
//     to remove the card from your hand.
//   [2021-02-05] If you’re casting a foretold card from exile for its foretell cost, you can’t
//     choose to cast it for any other alternative costs. You can, however, pay additional costs,
//     such as kicker costs. If the card has any mandatory additional costs, those must be paid to
//     cast the spell.

export default defineCard({
  name: "Doomskar",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures.\nForetell {1}{W}{W} (During your turn, you may pay {2} and exile this card from your hand face down. Cast it on a later turn for its foretell cost.)",
  foretell: { cost: "{1}{W}{W}" },
  effect: { kind: "destroy-all", filter: { type: "creature" } },
});
