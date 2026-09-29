import { defineCard } from "../define.js";

const DAMAGE_TEXT = "Whenever Rankle deals combat damage to a player, choose any number —";
const DISCARD_MODE = "Each player discards a card.";
const DRAW_MODE = "Each player loses 1 life and draws a card.";
const SACRIFICE_MODE = "Each player sacrifices a creature of their choice.";

// "Choose any number" includes none (the ruling). The chosen modes happen in
// the order printed, each in full before the next.
export default defineCard({
  name: "Rankle, Master of Pranks",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Rogue"],
  power: 3,
  toughness: 3,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${DAMAGE_TEXT}\n• ${DISCARD_MODE}\n• ${DRAW_MODE}\n• ${SACRIFICE_MODE}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 0,
        maxModes: 3,
        modes: [
          { text: DISCARD_MODE, effect: { kind: "discard", target: "each-player", amount: 1 } },
          {
            text: DRAW_MODE,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "lose-life", amount: 1, who: "each-player" },
                { kind: "draw", amount: 1, who: "each-player" },
              ],
            },
          },
          {
            text: SACRIFICE_MODE,
            effect: { kind: "sacrifice", who: "each-player", filter: { type: "creature" }, count: 1 },
          },
        ],
      },
      resolve: null,
      text: `${DAMAGE_TEXT} ${DISCARD_MODE} ${DRAW_MODE} ${SACRIFICE_MODE}`,
    },
  ],
});
