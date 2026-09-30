import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your upkeep, create a token that's a copy of another target nonland permanent you control.";

export default defineCard({
  name: "Extravagant Replication",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: { notTypes: ["land"] } } }],
      effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
      resolve: null,
      text: TEXT,
    },
  ],
});
