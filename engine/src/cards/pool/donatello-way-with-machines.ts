import { defineCard } from "../define.js";

export default defineCard({
  name: "Donatello, Way with Machines",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Ninja", "Turtle"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever an artifact you control enters, put a +1/+1 counter on Donatello.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever an artifact you control enters, put a +1/+1 counter on Donatello.",
    },
  ],
});
