import { defineCard } from "../define.js";

export default defineCard({
  name: "Symbiotic Wurm",
  manaCost: "{5}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Wurm"],
  power: 7,
  toughness: 7,
  text: "When this creature dies, create seven 1/1 green Insect creature tokens.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token", count: 7 },
      resolve: null,
      text: "When this creature dies, create seven 1/1 green Insect creature tokens.",
    },
  ],
});
