import { defineCard } from "../define.js";

export default defineCard({
  name: "Glider Kids",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Pilot", "Ally"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, scry 1. (Look at the top card of your library. You may put it on the bottom.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "When this creature enters, scry 1.",
    },
  ],
});
