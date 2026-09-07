import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 7 — additional combat. `additional-combat` bumps
 * `GameState.extraCombats`; when the post-combat main phase ends with it > 0,
 * `endStep` loops back to `begin-combat` (a combat phase then another main
 * phase). Simplified: the extra combat always lands after the post-combat main
 * phase regardless of which phase the ability was activated in.
 */
export default defineCard({
  name: "Aggravated Assault",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{3}{R}{R}: Untap all creatures you control. After this main phase, there is an additional combat phase followed by an additional main phase.",
  activated: [
    {
      cost: { mana: "{3}{R}{R}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
          { kind: "additional-combat" },
        ],
      },
      resolve: null,
      text: "{3}{R}{R}: Untap all creatures you control. Additional combat phase after this main phase.",
    },
  ],
});
