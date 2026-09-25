import { defineCard } from "../define.js";

export default defineCard({
  name: "Jewel-Eyed Cobra",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 3,
  toughness: 1,
  keywords: ["deathtouch"],
  text: "Deathtouch\nWhen this creature dies, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a Treasure token.",
    },
  ],
});
