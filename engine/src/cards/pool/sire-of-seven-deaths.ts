import { defineCard } from "../define.js";

export default defineCard({
  name: "Sire of Seven Deaths",
  manaCost: "{7}",
  colors: [],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 7,
  toughness: 7,
  keywords: ["reach", "first-strike", "vigilance", "menace", "trample", "lifelink"],
  text: "Reach, first strike\nVigilance, menace\nTrample, lifelink\nWard—Pay 7 life.",
  triggered: [
    {
      trigger: { on: "becomes-target", who: "self", byOpponentOnly: true },
      targets: [],
      effect: { kind: "ward", cost: { payLife: 7 } },
      resolve: null,
      text: "Ward—Pay 7 life.",
    },
  ],
});
