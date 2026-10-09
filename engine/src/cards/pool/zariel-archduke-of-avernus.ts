import { defineCard } from "../define.js";

// EDHREC rank 6428.
// Makes "Devil Token".
//
// The emblem's "at the end of the first combat phase on your turn" is the
// beginning of that phase's end of combat step (rule 511.2), only while it's
// the turn's first combat phase — so the extra combat it adds doesn't
// trigger it again.
const PLUS = "+1: Creatures you control get +1/+0 and gain haste until end of turn.";
const ZERO =
  '0: Create a 1/1 red Devil creature token with "When this token dies, it deals 1 damage to any target."';
const EMBLEM =
  "At the end of the first combat phase on your turn, untap target creature you control. After this phase, there is an additional combat phase.";
const ULTIMATE = `−6: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Zariel, Archduke of Avernus",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Zariel"],
  loyalty: 4,
  text: `${PLUS}\n${ZERO}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            power: 1,
            toughness: 0,
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "haste",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Devil Token", count: 1 },
      resolve: null,
      text: ZERO,
    },
    {
      loyaltyCost: -6,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: EMBLEM,
        triggered: [
          {
            trigger: { on: "step-begins", step: "end-combat", who: "you" },
            condition: { kind: "turn-structure", combatPhase: 1 },
            targets: ["creature-you-control"],
            effect: {
              kind: "sequence",
              effects: [
                { kind: "untap", target: 0 },
                { kind: "additional-combat", afterThisPhase: true },
              ],
            },
            resolve: null,
            text: EMBLEM,
          },
        ],
      },
      resolve: null,
      text: ULTIMATE,
    },
  ],
});
