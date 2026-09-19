import { defineCard } from "../define.js";

/**
 * Both compensation clauses are delayed triggered abilities (rule 603.7), and
 * the first is controlled by *the countered spell's controller* rather than by
 * this spell's — see the `delayed-trigger` effect's `controller`.
 *
 * Simplification: "may draw **up to** two cards" is offered as a plain "you
 * may draw two", since a `may` is one yes/no rather than a count.
 */
export default defineCard({
  name: "Arcane Denial",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Counter target spell. Its controller may draw up to two cards at the beginning of the next turn's upkeep.\n" +
    "You draw a card at the beginning of the next turn's upkeep.",
  targets: ["spell"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "counter", target: 0 },
      {
        kind: "delayed-trigger",
        at: "next-upkeep",
        controller: { controllerOfTarget: 0 },
        effect: { kind: "may", effect: { kind: "draw", amount: 2 }, prompt: "Draw two cards?" },
        text: "Draw up to two cards (Arcane Denial).",
      },
      {
        kind: "delayed-trigger",
        at: "next-upkeep",
        effect: { kind: "draw", amount: 1 },
        text: "Draw a card (Arcane Denial).",
      },
    ],
  },
});
