import { defineCard } from "../define.js";

export default defineCard({
  name: "Mausoleum Guard",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, create two 1/1 white Spirit creature tokens with flying.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 2 },
      resolve: null,
      text: "When this creature dies, create two 1/1 white Spirit creature tokens with flying.",
    },
  ],
});
