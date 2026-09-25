import { defineCard } from "../define.js";

export default defineCard({
  name: "Rumbling Sentry",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 3,
  toughness: 6,
  text: "When this creature enters, scry 1.",
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
