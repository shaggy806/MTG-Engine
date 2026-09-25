import { defineCard } from "../define.js";

export default defineCard({
  name: "Nexus Wardens",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Satyr", "Archer"],
  power: 1,
  toughness: 4,
  keywords: ["reach"],
  text: "Reach\nConstellation — Whenever an enchantment you control enters, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Constellation — Whenever an enchantment you control enters, you gain 2 life.",
    },
  ],
});
