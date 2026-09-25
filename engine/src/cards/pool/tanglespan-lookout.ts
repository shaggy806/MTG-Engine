import { defineCard } from "../define.js";

export default defineCard({
  name: "Tanglespan Lookout",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Satyr"],
  power: 2,
  toughness: 3,
  text: "Whenever an Aura you control enters, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Aura" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever an Aura you control enters, draw a card.",
    },
  ],
});
