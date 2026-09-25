import { defineCard } from "../define.js";

export default defineCard({
  name: "Symbiotic Beast",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Insect", "Beast"],
  power: 4,
  toughness: 4,
  text: "When this creature dies, create four 1/1 green Insect creature tokens.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token", count: 4 },
      resolve: null,
      text: "When this creature dies, create four 1/1 green Insect creature tokens.",
    },
  ],
});
