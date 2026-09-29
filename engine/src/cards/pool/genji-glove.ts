import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const GRANT_TEXT = "Equipped creature has double strike.";
const ATTACK_TEXT =
  "Whenever equipped creature attacks, if it's the first combat phase of the turn, untap it. After this phase, there is an additional combat phase.";

// "If it's the first combat phase of the turn" is the intervening-if, which
// is what stops the extra combat's attack from adding another (as Karlach,
// Fury of Avernus).
export default defineCard({
  name: "Genji Glove",
  manaCost: "{5}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${GRANT_TEXT}\n${ATTACK_TEXT}\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["double-strike"],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      condition: { kind: "turn-structure", combatPhase: 1 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: "trigger-object" },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [equip("{3}")],
});
