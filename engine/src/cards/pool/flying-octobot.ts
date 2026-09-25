import { defineCard } from "../define.js";

export default defineCard({
  name: "Flying Octobot",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Villain"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever another Villain you control enters, put a +1/+1 counter on this creature. This ability triggers only once each turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Villain" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another Villain you control enters, put a +1/+1 counter on this creature. This ability triggers only once each turn.",
      oncePerTurn: true,
    },
  ],
});
