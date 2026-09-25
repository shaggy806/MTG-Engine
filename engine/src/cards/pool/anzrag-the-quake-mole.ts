import { defineCard } from "../define.js";

// #494 in top-commanders.txt.
const BLOCKED_TEXT =
  "Whenever Anzrag becomes blocked, untap each creature you control. After this phase, there is an " +
  "additional combat phase.";
const LURE_TEXT = "{3}{R}{R}{G}{G}: Anzrag must be blocked each combat this turn if able.";

export default defineCard({
  name: "Anzrag, the Quake-Mole",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mole", "God"],
  power: 8,
  toughness: 4,
  text: `${BLOCKED_TEXT}\n${LURE_TEXT}`,
  triggered: [
    {
      trigger: { on: "becomes-blocked", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: { type: "creature", controlledBy: "you" } },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: BLOCKED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{R}{R}{G}{G}", tap: false },
      targets: [],
      effect: { kind: "restrict", target: "source", restrictions: ["must-be-blocked-if-able"] },
      resolve: null,
      text: LURE_TEXT,
    },
  ],
});
