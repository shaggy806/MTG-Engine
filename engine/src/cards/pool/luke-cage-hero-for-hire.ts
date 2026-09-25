import { defineCard } from "../define.js";

export default defineCard({
  name: "Luke Cage, Hero for Hire",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Mercenary", "Hero"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nAt the beginning of combat on your turn, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "At the beginning of combat on your turn, create a Treasure token.",
    },
  ],
});
