import { defineCard } from "../define.js";

// EDHREC rank 2638.
//
// Rulings:
//   [2021-04-16] You'll still pay all costs for a spell cast this way, including additional costs.
//     You may also pay alternative costs if any are available.
//   [2021-04-16] You must follow the normal timing permissions and restrictions for the exiled
//     card. If it's a land, you can't play it unless you have land plays available.
//   [2021-04-16] If you play a card this way, it leaves exile and becomes a new object. If it
//     returns to exile later in the turn, you can't play it again.
// Ever-Watching Threshold's trigger: once per attack declaration, by an
// opponent with at least one creature at you or a planeswalker you control.
// Only the active player declares attackers (rule 508.1), so "that player" is
// `"active-player"`. Any-colour spending is for a spell cast from it (118.14).
const TEXT =
  "Whenever an opponent attacks you and/or one or more planeswalkers you control, exile the top card of that player's library. You may play that card for as long as it remains exiled, and you may spend mana as though it were mana of any color to cast it.";

export default defineCard({
  name: "Cunning Rhetoric",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attack-with", who: "opponent", atLeast: 1, attackingYou: true },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        whose: "active-player",
        duration: "while-exiled",
        spendAs: "any-color",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
