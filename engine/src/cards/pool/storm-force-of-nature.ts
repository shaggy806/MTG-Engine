import { defineCard } from "../define.js";

// Commander backlog (top-commanders.txt). "The next instant or sorcery
// spell you cast this turn has storm" is a delayed "when you next cast an
// instant or sorcery spell this turn" (Yuna's and Codie's shape) whose storm
// copies that spell, counting the spells cast before it (rule 702.40a) — what
// the storm it gains would do as that spell is cast. Two combat-damage
// triggers give the next one storm twice, and each copies.
const TEMPEST_TEXT =
  "Ceaseless Tempest — Whenever Storm deals combat damage to a player, the next instant or sorcery spell you cast this turn has storm. (When you cast it, copy it for each spell cast before it this turn. You may choose new targets for the copies.)";

export default defineCard({
  name: "Storm, Force of Nature",
  manaCost: "{1}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Hero"],
  power: 3,
  toughness: 4,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${TEMPEST_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: { nextSpell: { typesAnyOf: ["instant", "sorcery"] } },
        effect: { kind: "storm", of: "trigger-object" },
        text: "Storm",
      },
      resolve: null,
      text: TEMPEST_TEXT,
    },
  ],
});
