import { defineCard } from "../define.js";

export default defineCard({
  name: "Ruin Crab",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Crab"],
  power: 0,
  toughness: 3,
  text: "Landfall — Whenever a land you control enters, each opponent mills three cards. (To mill a card, a player puts the top card of their library into their graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "mill", target: "each-opponent", amount: 3 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, each opponent mills three cards.",
    },
  ],
});
