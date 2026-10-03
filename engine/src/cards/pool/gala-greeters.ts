import { defineCard } from "../define.js";

const TRIGGER_TEXT =
  "Alliance — Whenever another creature you control enters, choose one that hasn't been chosen this turn —";
const COUNTER_MODE = "Put a +1/+1 counter on this creature.";
const TREASURE_MODE = "Create a tapped Treasure token.";
const LIFE_MODE = "You gain 2 life.";

// The mode is announced as each instance goes on the stack (rule 603.3c), so
// creatures entering together each take a different one, and past the third
// in a turn there's nothing left to choose (the ruling).
export default defineCard({
  name: "Gala Greeters",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: `${TRIGGER_TEXT}\n• ${COUNTER_MODE}\n• ${TREASURE_MODE}\n• ${LIFE_MODE}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        notChosenThisTurn: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: COUNTER_MODE, effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 } },
          { text: TREASURE_MODE, effect: { kind: "create-token", token: "Treasure Token", count: 1, tapped: true } },
          { text: LIFE_MODE, effect: { kind: "gain-life", amount: 2 } },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${COUNTER_MODE} ${TREASURE_MODE} ${LIFE_MODE}`,
    },
  ],
});
