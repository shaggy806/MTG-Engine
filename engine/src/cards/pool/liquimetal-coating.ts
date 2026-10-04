import { defineCard } from "../define.js";

// EDHREC rank 3691. Liquimetal Torque's `add-types`, over any permanent.
//
// Rulings:
//   [2011-01-01] Becoming an artifact doesn't change what color(s) a permanent is.
//   [2011-01-01] You may target any permanent with the ability, including an artifact.

const TEXT = "{T}: Target permanent becomes an artifact in addition to its other types until end of turn.";

export default defineCard({
  name: "Liquimetal Coating",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["permanent"],
      effect: { kind: "add-types", target: 0, addTypes: ["artifact"], duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
