import { defineCard } from "../define.js";

// EDHREC rank 5645.
//
// Rulings:
//   [2019-05-03] You may choose Pollenbright Druid as the target of its own ability.
//   [2023-02-04] You don't have to choose every permanent or player that has a counter, only the
//     ones you want to add another counter to.
//
// A modal triggered ability announces its mode as it goes on the stack, and
// the counter mode brings its own target.
const ETB_TEXT = "When this creature enters, choose one —";
const COUNTER_MODE = "Put a +1/+1 counter on target creature.";
const PROLIFERATE_MODE =
  "Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)";

export default defineCard({
  name: "Pollenbright Druid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: `${ETB_TEXT}\n• ${COUNTER_MODE}\n• ${PROLIFERATE_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
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
          { text: "Proliferate.", effect: { kind: "proliferate" } },
        ],
      },
      resolve: null,
      text: `${ETB_TEXT} ${COUNTER_MODE} Proliferate.`,
    },
  ],
});
