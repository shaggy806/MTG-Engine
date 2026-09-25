import { defineCard } from "../define.js";

export default defineCard({
  name: "Bramble Wurm",
  manaCost: "{6}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 7,
  toughness: 6,
  keywords: ["reach", "trample"],
  text: "Reach, trample\nWhen this creature enters, you gain 5 life.\n{2}{G}, Exile this card from your graveyard: You gain 5 life.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [],
      effect: { kind: "gain-life", amount: 5 },
      resolve: null,
      text: "{2}{G}, Exile this card from your graveyard: You gain 5 life.",
      zone: "graveyard",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 5 },
      resolve: null,
      text: "When this creature enters, you gain 5 life.",
    },
  ],
});
