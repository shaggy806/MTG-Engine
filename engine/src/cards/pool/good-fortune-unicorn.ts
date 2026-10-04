import { defineCard } from "../define.js";

// EDHREC rank 3524.

const TEXT = "Whenever another creature you control enters, put a +1/+1 counter on that creature.";

export default defineCard({
  name: "Good-Fortune Unicorn",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Unicorn"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
