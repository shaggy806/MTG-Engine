import { defineCard } from "../define.js";

export default defineCard({
  name: "Soul of the Harvest",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: "Trample\nWhenever another nontoken creature you control enters, you may draw a card.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever another nontoken creature you control enters, you may draw a card.",
    },
  ],
});
