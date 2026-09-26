import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT = "Whenever equipped creature attacks, choose one —";
const SORT_MODE = "Sort Inventory — Draw a card, then discard a card.";
const PERK_MODE = "Pick a Perk — Put a +1/+1 counter on that creature.";
const MAP_MODE = "Check Map — Untap up to two target lands.";

export default defineCard({
  name: "Pip-Boy 3000",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ATTACK_TEXT}\n• ${SORT_MODE}\n• ${PERK_MODE}\n• ${MAP_MODE}\nEquip {2}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: SORT_MODE,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "draw", amount: 1 },
                { kind: "discard", target: "you", amount: 1 },
              ],
            },
          },
          {
            text: PERK_MODE,
            effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
          },
          {
            text: MAP_MODE,
            targets: [
              { kind: "optional", of: "land" },
              { kind: "optional", of: { kind: "other", of: "land", than: { slots: [0] } } },
            ],
            effect: {
              kind: "sequence",
              effects: [
                { kind: "untap", target: 0 },
                { kind: "untap", target: 1 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: `${ATTACK_TEXT} ${SORT_MODE} ${PERK_MODE} ${MAP_MODE}`,
    },
  ],
  activated: [equip("{2}")],
});
