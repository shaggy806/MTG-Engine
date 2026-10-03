import { defineCard } from "../define.js";

// Top-commanders rank 217. The rulings this follows: it can trigger three
// times a turn — your first instant, your first sorcery and your first Otter
// spell other than Alania (Alania's own cast doesn't count toward "first
// Otter") — each spell read as it was cast; the opponent is targeted as it
// triggers; the ability and the copy both resolve before the spell, even if
// it was countered; the copy keeps its modes, {X} and the additional costs
// paid, isn't cast, and a copy of a permanent spell becomes a token.
const COPY_TEXT =
  "Whenever you cast a spell, if it's the first instant spell, the first sorcery spell, or the first Otter " +
  "spell other than Alania you've cast this turn, you may have target opponent draw a card. If you do, copy " +
  "that spell. You may choose new targets for the copy.";

export default defineCard({
  name: "Alania, Divergent Storm",
  manaCost: "{3}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Otter", "Wizard"],
  power: 3,
  toughness: 5,
  text: COPY_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you" },
      condition: {
        kind: "trigger-spell-first",
        anyOf: [
          { filter: { type: "instant" } },
          { filter: { type: "sorcery" } },
          { filter: { subtype: "Otter" }, otherThanSource: true },
        ],
      },
      targets: ["opponent"],
      effect: {
        kind: "may",
        prompt: "Have target opponent draw a card to copy that spell?",
        effect: { kind: "draw", amount: 1, target: 0 },
        then: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
