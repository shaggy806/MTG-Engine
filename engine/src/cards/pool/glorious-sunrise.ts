import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const COMBAT_TEXT = "At the beginning of combat on your turn, choose one —";
const PUMP_MODE = "Creatures you control get +1/+1 and gain trample until end of turn.";
const LAND_MODE = 'Target land gains "{T}: Add {G}{G}{G}" until end of turn.';
const DRAW_MODE = "Draw a card if you control a creature with power 3 or greater.";
const LIFE_MODE = "You gain 3 life.";

// The draw mode can be chosen with no such creature; it asks as it resolves
// (the ruling).
export default defineCard({
  name: "Glorious Sunrise",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${COMBAT_TEXT}\n• ${PUMP_MODE}\n• ${LAND_MODE}\n• ${DRAW_MODE}\n• ${LIFE_MODE}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: PUMP_MODE,
            effect: {
              kind: "sequence",
              effects: [
                {
                  kind: "modify-pt-all",
                  filter: { type: "creature", controlledBy: "you" },
                  power: 1,
                  toughness: 1,
                  duration: "end-of-turn",
                },
                {
                  kind: "grant-keyword-all",
                  filter: { type: "creature", controlledBy: "you" },
                  keyword: "trample",
                  duration: "end-of-turn",
                },
              ],
            },
          },
          {
            text: LAND_MODE,
            targets: ["land"],
            effect: {
              kind: "grant-activated",
              target: 0,
              ability: addManaAbility({ mana: "G", amount: 3, text: "{T}: Add {G}{G}{G}." }),
              duration: "end-of-turn",
            },
          },
          {
            text: DRAW_MODE,
            effect: {
              kind: "conditional",
              condition: {
                kind: "controls",
                filter: { type: "creature", power: { op: "gte", n: 3 } },
                atLeast: 1,
              },
              then: { kind: "draw", amount: 1 },
            },
          },
          { text: LIFE_MODE, effect: { kind: "gain-life", amount: 3 } },
        ],
      },
      resolve: null,
      text: `${COMBAT_TEXT} ${PUMP_MODE} ${LAND_MODE} ${DRAW_MODE} ${LIFE_MODE}`,
    },
  ],
});
