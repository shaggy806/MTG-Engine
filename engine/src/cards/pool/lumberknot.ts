import { defineCard } from "../define.js";

export default defineCard({
  name: "Lumberknot",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk"],
  power: 1,
  toughness: 1,
  keywords: ["hexproof"],
  text: "Hexproof (This creature can't be the target of spells or abilities your opponents control.)\nWhenever a creature dies, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "dies", who: "any", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever a creature dies, put a +1/+1 counter on this creature.",
    },
  ],
});
