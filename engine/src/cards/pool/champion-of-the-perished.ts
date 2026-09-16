import { defineCard } from "../define.js";

export default defineCard({
  name: "Champion of the Perished",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 1,
  text:
    "Whenever another Zombie you control enters, put a +1/+1 counter on Champion " +
    "of the Perished.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { subtype: "Zombie", controlledBy: "you" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text:
        "Whenever another Zombie you control enters, put a +1/+1 counter on Champion " +
        "of the Perished.",
    },
  ],
});
