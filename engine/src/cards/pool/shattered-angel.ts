import { defineCard } from "../define.js";

export default defineCard({
  name: "Shattered Angel",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever a land an opponent controls enters, you may gain 3 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { type: "land", controlledBy: "opponent" },
      },
      targets: [],
      effect: { kind: "may", prompt: "Gain 3 life?", effect: { kind: "gain-life", amount: 3 } },
      resolve: null,
      text: "Whenever a land an opponent controls enters, you may gain 3 life.",
    },
  ],
});
