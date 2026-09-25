import { defineCard } from "../define.js";

export default defineCard({
  name: "Mossdog",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Dog"],
  power: 1,
  toughness: 1,
  text: "Whenever this creature becomes the target of a spell or ability an opponent controls, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever this creature becomes the target of a spell or ability an opponent controls, put a +1/+1 counter on this creature.",
    },
  ],
});
