import { defineCard } from "../define.js";

export default defineCard({
  name: "Soul Warden",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 1,
  text: "Whenever another creature enters the battlefield, you gain 1 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        otherOnly: true,
        filter: { type: "creature" },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever another creature enters the battlefield, you gain 1 life.",
    },
  ],
});
