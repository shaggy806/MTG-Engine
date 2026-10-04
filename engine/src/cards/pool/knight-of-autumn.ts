import { defineCard } from "../define.js";

// EDHREC rank 6072.

const ETB_TEXT = "When this creature enters, choose one —";
const COUNTER_MODE = "Put two +1/+1 counters on this creature.";
const DESTROY_MODE = "Destroy target artifact or enchantment.";
const LIFE_MODE = "You gain 4 life.";

// Charming Prince's shape: the mode is announced as the trigger goes on the
// stack, and only the destroy mode brings a target.
export default defineCard({
  name: "Knight of Autumn",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Dryad", "Knight"],
  power: 2,
  toughness: 1,
  text: `${ETB_TEXT}\n• ${COUNTER_MODE}\n• ${DESTROY_MODE}\n• ${LIFE_MODE}`,
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
          { text: COUNTER_MODE, effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 } },
          {
            text: DESTROY_MODE,
            targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "enchantment"] } }],
            effect: { kind: "destroy", target: 0 },
          },
          { text: LIFE_MODE, effect: { kind: "gain-life", amount: 4 } },
        ],
      },
      resolve: null,
      text: `${ETB_TEXT} ${COUNTER_MODE} ${DESTROY_MODE} ${LIFE_MODE}`,
    },
  ],
});
