import { defineCard } from "../define.js";

export default defineCard({
  name: "Experimental Aviator",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 0,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, create two 1/1 colorless Thopter artifact creature tokens with flying.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 2 },
      resolve: null,
      text: "When this creature enters, create two 1/1 colorless Thopter artifact creature tokens with flying.",
    },
  ],
});
