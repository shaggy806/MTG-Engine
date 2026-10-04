import { defineCard } from "../define.js";

// EDHREC rank 2816.
// Makes Myr → use "Myr Token".

const TEXT =
  "Whenever a nontoken creature enters, if this artifact is untapped, that creature's controller creates a 1/1 colorless Myr artifact creature token.";

export default defineCard({
  name: "Genesis Chamber",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { token: false, type: "creature" } },
      // Intervening-if (rule 603.4): checked as it triggers and as it resolves.
      condition: { kind: "source", filter: { tapped: false } },
      targets: [],
      // "That creature's controller": the entering creature's, not this artifact's.
      effect: { kind: "create-token", token: "Myr Token", count: 1, who: "trigger-controller" },
      resolve: null,
      text: TEXT,
    },
  ],
});
