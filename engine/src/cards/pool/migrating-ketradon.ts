import { defineCard } from "../define.js";

export default defineCard({
  name: "Migrating Ketradon",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 6,
  toughness: 6,
  keywords: ["reach"],
  cycling: { cost: "{2}" },
  text: "Reach\nWhen this creature enters, you gain 4 life.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: "When this creature enters, you gain 4 life.",
    },
  ],
});
