import { defineCard } from "../define.js";

export default defineCard({
  name: "Somnomancer",
  manaCost: "{1}{W/U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Kithkin", "Wizard"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, you may tap target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "may", prompt: "Tap target creature?", effect: { kind: "tap", target: 0 } },
      resolve: null,
      text: "When this creature enters, you may tap target creature.",
    },
  ],
});
