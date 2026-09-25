import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightless Evangel",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 2,
  toughness: 2,
  text: "Whenever you sacrifice another creature or artifact, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: {
        on: "sacrifice",
        who: "you",
        filter: { typesAnyOf: ["creature", "artifact"] },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you sacrifice another creature or artifact, put a +1/+1 counter on this creature.",
    },
  ],
});
