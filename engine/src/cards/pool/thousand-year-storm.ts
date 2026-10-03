import { defineCard } from "../define.js";

const TEXT =
  "Whenever you cast an instant or sorcery spell, copy it for each other instant and sorcery spell you've cast " +
  "before it this turn. You may choose new targets for the copies.";

// The count is the instants and sorceries you cast this turn before this one,
// countered ones included and whether or not Thousand-Year Storm was out then,
// fixed as it triggers (`countCastBefore`). The copies are made even if the
// spell was countered in response, aren't cast (so they don't trigger it), and
// each may get new targets, asked one at a time (the rulings).
export default defineCard({
  name: "Thousand-Year Storm",
  manaCost: "{4}{U}{R}",
  colors: ["U", "R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { typesAnyOf: ["instant", "sorcery"] },
        countCastBefore: { typesAnyOf: ["instant", "sorcery"] },
      },
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true, count: { triggerValue: true } },
      resolve: null,
      text: TEXT,
    },
  ],
});
