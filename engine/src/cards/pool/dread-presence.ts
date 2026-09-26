import { defineCard } from "../define.js";

const TRIGGER_TEXT = "Whenever a Swamp you control enters, choose one —";
const DRAW_MODE = "You draw a card and you lose 1 life.";
const DAMAGE_MODE = "This creature deals 2 damage to any target and you gain 2 life.";

// A Swamp is the land subtype, not any land that makes {B}; a target gone by
// resolution means no life either (the rulings — rule 608.2b).
export default defineCard({
  name: "Dread Presence",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Nightmare"],
  power: 3,
  toughness: 3,
  text: `${TRIGGER_TEXT}\n• ${DRAW_MODE}\n• ${DAMAGE_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Swamp" } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: DRAW_MODE,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "draw", amount: 1 },
                { kind: "lose-life", amount: 1 },
              ],
            },
          },
          {
            text: DAMAGE_MODE,
            targets: ["any-target"],
            effect: {
              kind: "sequence",
              effects: [
                { kind: "damage", amount: 2, target: 0 },
                { kind: "gain-life", amount: 2 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${DRAW_MODE} ${DAMAGE_MODE}`,
    },
  ],
});
