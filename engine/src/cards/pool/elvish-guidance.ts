import { defineCard } from "../define.js";

// EDHREC rank 6478.
//
// Wild Growth with a count: a triggered mana ability (rule 605.1b), applied
// as the land's mana is made, and the Elves — anyone's, this one counts the
// whole battlefield — counted then (`tappedForManaExtras`).
const TEXT =
  "Whenever enchanted land is tapped for mana, its controller adds an additional {G} for each Elf on the battlefield.";

export default defineCard({
  name: "Elvish Guidance",
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
      effect: { kind: "add-mana", mana: "G", amount: { countOf: { subtype: "Elf" } } },
      resolve: null,
      text: TEXT,
    },
  ],
});
