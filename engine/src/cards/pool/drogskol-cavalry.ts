import { defineCard } from "../define.js";

export default defineCard({
  name: "Drogskol Cavalry",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Knight"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever another Spirit you control enters, you gain 2 life.\n{3}{W}: Create a 1/1 white Spirit creature token with flying.",
  activated: [
    {
      cost: { mana: "{3}{W}", tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: "{3}{W}: Create a 1/1 white Spirit creature token with flying.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Spirit" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Whenever another Spirit you control enters, you gain 2 life.",
    },
  ],
});
