import { defineCard } from "../define.js";

export default defineCard({
  name: "Malakir Cullblade",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warrior"],
  power: 1,
  toughness: 1,
  text: "Whenever a creature an opponent controls dies, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature", controlledBy: "opponent" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever a creature an opponent controls dies, put a +1/+1 counter on this creature.",
    },
  ],
});
