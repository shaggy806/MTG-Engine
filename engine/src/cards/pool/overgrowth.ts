import { defineCard } from "../define.js";

const TEXT = "Whenever enchanted land is tapped for mana, its controller adds an additional {G}{G}.";

// A triggered mana ability (rule 605.1b), like Wild Growth's.
export default defineCard({
  name: "Overgrowth",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant land\n${TEXT}`,
  targets: ["land"],
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "attached" },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 2 },
      resolve: null,
      text: TEXT,
    },
  ],
});
