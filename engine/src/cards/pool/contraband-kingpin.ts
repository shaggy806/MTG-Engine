import { defineCard } from "../define.js";

export default defineCard({
  name: "Contraband Kingpin",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Aetherborn", "Rogue"],
  power: 1,
  toughness: 4,
  keywords: ["lifelink"],
  text: "Lifelink\nWhenever an artifact you control enters, scry 1.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" } },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "Whenever an artifact you control enters, scry 1.",
    },
  ],
});
