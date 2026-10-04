import { defineCard } from "../define.js";

// EDHREC rank 3375.

const EXILE_TEXT = "At the beginning of the end step, exile this token.";
const TEXT = `Create a token that's a copy of target creature, except it has haste and "${EXILE_TEXT}"`;

export default defineCard({
  name: "Heat Shimmer",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: TEXT,
  targets: ["creature"],
  // Electroduplicate's shape, with the token's own end-step ability exiling
  // it rather than sacrificing it: a copy exception, so it's part of the
  // token (rule 707.9b), and it triggers at every end step, not just yours.
  effect: {
    kind: "create-token-copy",
    of: 0,
    count: 1,
    who: "you",
    exceptions: {
      keywords: ["haste"],
      triggered: [
        {
          trigger: { on: "step-begins", step: "end", who: "any" },
          targets: [],
          effect: { kind: "exile", target: "source" },
          resolve: null,
          text: EXILE_TEXT,
        },
      ],
    },
  },
});
