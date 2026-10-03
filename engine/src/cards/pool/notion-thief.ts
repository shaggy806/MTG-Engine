import { defineCard } from "../define.js";

const TEXT =
  "If an opponent would draw a card except the first one they draw in each of their draw steps, instead that " +
  "player skips that draw and you draw a card.";

// The rulings this follows: only the draw is replaced — the rest of what the
// opponent was told to do ("then discard a card") still happens; the first
// card they draw in their own draw step is spared, the turn-based draw or, if
// that was skipped, the next one; and with Notion Thieves on both sides each
// applies to a draw once, so in a duel where both players have one the draw
// stays with the player who began it (`Game.drawCard`).
export default defineCard({
  name: "Notion Thief",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 3,
  toughness: 1,
  keywords: ["flash"],
  text: `Flash\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-draw", who: "opponent", instead: "you-draw", exceptFirstInDrawStep: true },
      text: TEXT,
    },
  ],
});
