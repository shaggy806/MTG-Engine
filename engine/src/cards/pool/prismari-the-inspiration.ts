import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// Commander backlog (top-commanders.txt). Storm is granted to each instant
// and sorcery spell as its own `this-cast` trigger (Abaddon's shape for
// cascade), so a spell that already has storm triggers twice (the
// 2026-03-20 ruling); the copies aren't cast, so they count toward no later
// storm.
const STORM_TEXT =
  "Instant and sorcery spells you cast have storm. (Whenever you cast an instant or sorcery spell, copy it for each spell cast before it this turn. You may choose new targets for the copies.)";

export default defineCard({
  name: "Prismari, the Inspiration",
  manaCost: "{5}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 7,
  toughness: 7,
  keywords: ["flying"],
  text: `Flying\nWard—Pay 5 life.\n${STORM_TEXT}`,
  triggered: [ward({ payLife: 5 })],
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: {
        filter: { typesAnyOf: ["instant", "sorcery"] },
        triggered: [
          {
            trigger: { on: "this-cast" },
            targets: [],
            effect: { kind: "storm" },
            resolve: null,
            text: "Storm",
          },
        ],
      },
      text: STORM_TEXT,
    },
  ],
});
