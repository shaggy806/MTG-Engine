import { defineCard } from "../define.js";

// EDHREC rank 3897.
// Makes Insect → new token "Insect Token (Infestation Sage)" (scaffolded).

export default defineCard({
  name: "Infestation Sage",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elf", "Warlock"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, create a 1/1 black and green Insect creature token with flying.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Insect Token (Infestation Sage)", count: 1 },
      resolve: null,
      text: "When this creature dies, create a 1/1 black and green Insect creature token with flying.",
    },
  ],
});
