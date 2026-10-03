import { defineCard } from "../define.js";

const TEXT =
  "Draw two cards, then discard a card and you lose 2 life. Create X tapped 2/2 black Zombie Druid creature " +
  "tokens, where X is the number of cards that were put into your graveyard from your hand or library this turn.";

// X is counted as the tokens are made, so the card just discarded is one of
// them — and so is every card discarded, milled, surveilled or cycled into
// your graveyard earlier in the turn, whatever did it. Welcome the Dead
// itself goes to the graveyard from the stack, which doesn't count.
export default defineCard({
  name: "Welcome the Dead",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{5}{B}" },
  text: `${TEXT}\nFlashback {5}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)`,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "discard", target: "you", amount: 1 },
      { kind: "lose-life", amount: 2 },
      {
        kind: "create-token",
        token: "Zombie Druid Token",
        count: { turnStat: "cards-to-graveyard-from-hand-or-library" },
        tapped: true,
      },
    ],
  },
});
