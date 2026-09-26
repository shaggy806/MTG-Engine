import { defineCard } from "../define.js";

const LANDFALL_TEXT = "Landfall — Whenever a land you control enters, choose one —";
const COUNTER_MODE = "Put a +1/+1 counter on target creature.";
const LIFE_MODE = "You gain 2 life.";

export default defineCard({
  name: "Retreat to Kazandu",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${LANDFALL_TEXT}\n• ${COUNTER_MODE}\n• ${LIFE_MODE}`,
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
            text: COUNTER_MODE,
            targets: ["creature"],
            effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          },
          { text: LIFE_MODE, effect: { kind: "gain-life", amount: 2 } },
        ],
      },
      resolve: null,
      text: `${LANDFALL_TEXT} ${COUNTER_MODE} ${LIFE_MODE}`,
    },
  ],
});
