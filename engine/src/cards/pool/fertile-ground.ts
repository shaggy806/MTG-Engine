import { defineCard } from "../define.js";

const TEXT = "Whenever enchanted land is tapped for mana, its controller adds an additional one mana of any color.";

// A triggered mana ability (rule 605.1b): the extra mana goes to whoever
// tapped the land, at once, of the colour they pick — with the land's own
// picks when it's tapped by hand, and whatever the cost wants when the
// auto-payer taps it.
export default defineCard({
  name: "Fertile Ground",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant land\n${TEXT}`,
  targets: ["land"],
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "attached" },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
