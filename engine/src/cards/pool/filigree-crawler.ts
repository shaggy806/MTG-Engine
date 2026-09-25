import { defineCard } from "../define.js";

export default defineCard({
  name: "Filigree Crawler",
  manaCost: "{4}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Insect"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, create a 1/1 colorless Thopter artifact creature token with flying.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 colorless Thopter artifact creature token with flying.",
    },
  ],
});
