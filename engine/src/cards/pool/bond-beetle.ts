import { defineCard } from "../define.js";

export default defineCard({
  name: "Bond Beetle",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 0,
  toughness: 1,
  text: "When this creature enters, put a +1/+1 counter on target creature.",
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
