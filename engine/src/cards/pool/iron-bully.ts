import { defineCard } from "../define.js";

export default defineCard({
  name: "Iron Bully",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 1,
  toughness: 1,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\nWhen this creature enters, put a +1/+1 counter on target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "When this creature enters, put a +1/+1 counter on target creature.",
    },
  ],
});
