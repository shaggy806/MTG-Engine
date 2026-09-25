import { defineCard } from "../define.js";

export default defineCard({
  name: "Heavy Infantry",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 4,
  text: "When this creature enters, tap target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "When this creature enters, tap target creature an opponent controls.",
    },
  ],
});
