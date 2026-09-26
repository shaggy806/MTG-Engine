import { defineCard } from "../define.js";

const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, choose one —";
const PUMP_MODE = "Target creature gets +1/+0 and gains deathtouch until end of turn.";
const DRAIN_MODE = "Each opponent loses 1 life and you gain 1 life.";

export default defineCard({
  name: "Retreat to Hagra",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${LANDFALL_TEXT}\n• ${PUMP_MODE}\n• ${DRAIN_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: PUMP_MODE,
            targets: ["creature"],
            effect: {
              kind: "sequence",
              effects: [
                { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
                { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" },
              ],
            },
          },
          {
            text: DRAIN_MODE,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "lose-life", amount: 1, who: "each-opponent" },
                { kind: "gain-life", amount: 1 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: `${LANDFALL_TEXT} ${PUMP_MODE} ${DRAIN_MODE}`,
    },
  ],
});
