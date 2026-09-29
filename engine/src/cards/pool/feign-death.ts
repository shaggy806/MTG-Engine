import { defineCard } from "../define.js";

const RETURN_TEXT =
  "When this creature dies, return it to the battlefield tapped under its owner's control with a +1/+1 counter on it.";

export default defineCard({
  name: "Feign Death",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: `Until end of turn, target creature gains "${RETURN_TEXT}"`,
  targets: ["creature"],
  effect: {
    kind: "grant-triggered",
    target: 0,
    duration: "end-of-turn",
    ability: {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "put-onto-battlefield",
        target: "trigger-object",
        enterTapped: true,
        withCounters: { kind: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  },
});
