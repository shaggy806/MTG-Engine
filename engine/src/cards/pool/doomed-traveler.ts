import { defineCard } from "../define.js";

export default defineCard({
  name: "Doomed Traveler",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, create a 1/1 white Spirit creature token with flying.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 white Spirit creature token with flying.",
    },
  ],
});
