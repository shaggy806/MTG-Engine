import { defineCard } from "../define.js";

export default defineCard({
  name: "Symbiotic Elf",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, create two 1/1 green Insect creature tokens.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token", count: 2 },
      resolve: null,
      text: "When this creature dies, create two 1/1 green Insect creature tokens.",
    },
  ],
});
