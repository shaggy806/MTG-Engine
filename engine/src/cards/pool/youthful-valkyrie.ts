import { defineCard } from "../define.js";

export default defineCard({
  name: "Youthful Valkyrie",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever another Angel you control enters, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Angel" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever another Angel you control enters, put a +1/+1 counter on this creature.",
    },
  ],
});
