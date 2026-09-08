import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 11 EG-6 — a `would-draw` replacement (Notion Thief-lite). Real
 * Notion Thief exempts "the first card [each opponent] draws in each of their
 * draw steps"; this drops that clause. `Game.drawCard` redirects an opponent's
 * draw to Notion Thief's controller.
 */
export default defineCard({
  name: "Notion Thief",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 3,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash\nIf an opponent would draw a card, you draw a card instead.",
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-draw", who: "opponent", instead: "you-draw" },
      text: "If an opponent would draw a card, you draw a card instead.",
    },
  ],
});
