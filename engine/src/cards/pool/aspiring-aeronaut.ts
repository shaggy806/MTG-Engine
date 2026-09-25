import { defineCard } from "../define.js";

export default defineCard({
  name: "Aspiring Aeronaut",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\nWhen this creature enters, create a 1/1 colorless Thopter artifact creature token with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a 1/1 colorless Thopter artifact creature token with flying.",
    },
  ],
});
