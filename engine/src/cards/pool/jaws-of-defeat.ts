import { defineCard } from "../define.js";

const TEXT =
  "Whenever a creature you control enters, target opponent loses life equal to the difference between that creature's power and its toughness.";

// Read as it resolves, the creature as it last existed if it has left.
export default defineCard({
  name: "Jaws of Defeat",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: ["opponent"],
      effect: {
        kind: "lose-life",
        target: 0,
        amount: { difference: [{ powerOf: "trigger-object" }, { toughnessOf: "trigger-object" }], absolute: true },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
