import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghirapur Gearcrafter",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, create a 1/1 colorless Thopter artifact creature token with flying. (A creature with flying can't be blocked except by creatures with flying or reach.)",
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
