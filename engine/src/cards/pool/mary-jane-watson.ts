import { defineCard } from "../define.js";

export default defineCard({
  name: "Mary Jane Watson",
  manaCost: "{1}{G/W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Performer"],
  power: 2,
  toughness: 2,
  text: "Whenever a Spider you control enters, draw a card. This ability triggers only once each turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Spider" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a Spider you control enters, draw a card. This ability triggers only once each turn.",
      oncePerTurn: true,
    },
  ],
});
