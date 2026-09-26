import { defineCard } from "../define.js";

/** "Untap up to three lands" doesn't target: the lands are chosen as the
 * spell resolves, any player's (the ruling) — a `choose-permanents` step, so
 * nothing about them can make the spell fizzle and cost the draw. */
export default defineCard({
  name: "Frantic Search",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw two cards, then discard two cards. Untap up to three lands.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "discard", target: "you", amount: 2 },
      {
        kind: "choose-permanents",
        filter: { type: "land" },
        upTo: 3,
        then: { kind: "untap", target: 0 },
        prompt: "Untap up to three lands",
      },
    ],
  },
});
