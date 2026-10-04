import { defineCard } from "../define.js";

// EDHREC rank 4243.

export default defineCard({
  name: "Herd Baloth",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 4,
  toughness: 4,
  text: "Whenever one or more +1/+1 counters are put on this creature, you may create a 4/4 green Beast creature token.",
  triggered: [
    {
      trigger: { on: "counters-put", who: "self", counter: "+1/+1" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Create a 4/4 green Beast token?",
        effect: { kind: "create-token", token: "Beast Token", count: 1 },
      },
      resolve: null,
      text: "Whenever one or more +1/+1 counters are put on this creature, you may create a 4/4 green Beast creature token.",
    },
  ],
});
