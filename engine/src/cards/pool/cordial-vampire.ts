import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

const TEXT = "Whenever this creature or another creature dies, put a +1/+1 counter on each Vampire you control.";

export default defineCard({
  name: "Cordial Vampire",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    ...thisOrAnother({
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", subtype: "Vampire", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    }),
  ],
});
