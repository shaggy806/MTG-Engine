import { defineCard } from "../define.js";

export default defineCard({
  name: "Snake Basket",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{X}, Sacrifice this artifact: Create X 1/1 green Snake creature tokens. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{X}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Snake Token", count: "x" },
      resolve: null,
      text: "{X}, Sacrifice this artifact: Create X 1/1 green Snake creature tokens. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
