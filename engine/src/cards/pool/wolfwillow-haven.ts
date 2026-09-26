import { defineCard } from "../define.js";

const TEXT = "Whenever enchanted land is tapped for mana, its controller adds an additional {G}.";
const WOLF_TEXT = "{4}{G}, Sacrifice this Aura: Create a 2/2 green Wolf creature token. Activate only during your turn.";

export default defineCard({
  name: "Wolfwillow Haven",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant land\n${TEXT}\n${WOLF_TEXT}`,
  targets: ["land"],
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "attached" },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{G}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Wolf Token", count: 1 },
      resolve: null,
      text: WOLF_TEXT,
      condition: { kind: "your-turn" },
    },
  ],
});
