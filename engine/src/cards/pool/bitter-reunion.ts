import { defineCard } from "../define.js";

const ENTER_TEXT = "When this enchantment enters, you may discard a card. If you do, draw two cards.";
const SAC_TEXT = "{1}, Sacrifice this enchantment: Creatures you control gain haste until end of turn.";

// "If you do": the draw needs a card actually discarded, so an empty hand
// draws nothing (Hazoret's Monument's shape).
export default defineCard({
  name: "Bitter Reunion",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${SAC_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard a card to draw two cards?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded" },
              then: { kind: "draw", amount: 2 },
            },
          ],
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "haste",
        duration: "end-of-turn",
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
