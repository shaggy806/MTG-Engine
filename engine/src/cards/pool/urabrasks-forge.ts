import { defineCard } from "../define.js";

// EDHREC rank 2580.

const TEXT =
  "At the beginning of combat on your turn, put an oil counter on this artifact, then create an X/1 red Phyrexian Horror creature token with trample and haste, where X is the number of oil counters on this artifact. Sacrifice that token at the beginning of the next end step.";

export default defineCard({
  name: "Urabrask's Forge",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "oil", amount: 1 },
          {
            kind: "create-token",
            token: "Phyrexian Horror Token",
            count: 1,
            // X is read as the token is made; `countersOn: "source"` reads the
            // Forge as it last existed if it has left by then.
            basePt: { power: { countersOn: "source", counter: "oil" }, toughness: 1 },
          },
          {
            // A real delayed triggered ability (rule 603.7) on the token just
            // made — Ashling, the Limitless's shape.
            kind: "delayed-trigger",
            at: "next-end-step",
            about: "created",
            effect: { kind: "sacrifice-target", target: 0 },
            text: "Sacrifice that token at the beginning of the next end step.",
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
