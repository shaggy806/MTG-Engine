import { defineCard } from "../define.js";

export default defineCard({
  name: "Hedron Crab",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Crab"],
  power: 0,
  toughness: 2,
  text: "Landfall — Whenever a land you control enters, target player mills three cards. (They put the top three cards of their library into their graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 3 },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, target player mills three cards.",
    },
  ],
});
