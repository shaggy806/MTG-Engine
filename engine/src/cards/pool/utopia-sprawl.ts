import { defineCard } from "../define.js";

const TEXT =
  "Whenever enchanted Forest is tapped for mana, its controller adds an additional one mana of the chosen color.";

// The colour is named as it enters (rule 614.12); the extra mana is a
// triggered mana ability (rule 605.1b) — at once, off the stack, to whoever
// tapped the Forest, and counted by the auto-payer.
export default defineCard({
  name: "Utopia Sprawl",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant Forest\nAs this Aura enters, choose a color.\n${TEXT}`,
  targets: [{ kind: "permanent", filter: { subtype: "Forest" } }],
  chooseOnEnter: ["W", "U", "B", "R", "G"],
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "attached" },
      targets: [],
      effect: { kind: "add-mana", mana: "chosen", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
