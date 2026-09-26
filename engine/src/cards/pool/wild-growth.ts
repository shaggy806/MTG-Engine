import { defineCard } from "../define.js";

const TEXT = "Whenever enchanted land is tapped for mana, its controller adds an additional {G}.";

// A triggered mana ability (rule 605.1b): the {G} goes to whoever tapped the
// land, at once, and isn't something the land itself produces (the ruling).
export default defineCard({
  name: "Wild Growth",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant land\n${TEXT}`,
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
});
