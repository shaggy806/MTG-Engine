import { defineCard } from "../define.js";

export default defineCard({
  name: "Vessel of Ephemera",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "{2}{W}, Sacrifice this enchantment: Create two 1/1 white Spirit creature tokens with flying.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 2 },
      resolve: null,
      text: "{2}{W}, Sacrifice this enchantment: Create two 1/1 white Spirit creature tokens with flying.",
    },
  ],
});
