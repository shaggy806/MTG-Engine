import { defineCard } from "../define.js";

/** "Untap up to three lands" is three optional target slots — the engine's
 * target list is fixed-arity, so "up to N" is N slots each skippable. */
export default defineCard({
  name: "Frantic Search",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw two cards, then discard two cards. Untap up to three lands.",
  targets: [
    { kind: "optional", of: "land" },
    { kind: "optional", of: "land" },
    { kind: "optional", of: "land" },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "discard", target: "you", amount: 2 },
      { kind: "untap", target: 0 },
      { kind: "untap", target: 1 },
      { kind: "untap", target: 2 },
    ],
  },
});
