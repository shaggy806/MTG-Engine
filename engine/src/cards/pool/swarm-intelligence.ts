import { defineCard } from "../define.js";

// EDHREC rank 4751.
// Wandering Archaic's "you may copy that spell" — a `may` around the copy.
const COPY_TEXT =
  "Whenever you cast an instant or sorcery spell, you may copy that spell. You may choose new targets for the copy.";

export default defineCard({
  name: "Swarm Intelligence",
  manaCost: "{6}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: COPY_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Copy that spell?",
        effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
