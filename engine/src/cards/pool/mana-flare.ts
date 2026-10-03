import { defineCard } from "../define.js";

const TEXT = "Whenever a player taps a land for mana, that player adds one mana of any type that land produced.";

// A triggered mana ability (rule 605.1b) for every player's lands: the mana
// goes to whoever tapped the land, at once, with none of its restrictions or
// riders, and of the type they pick when it made several (the rulings).
export default defineCard({
  name: "Mana Flare",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "tapped-for-mana", who: "any", filter: { type: "land" } },
      targets: [],
      effect: { kind: "add-mana", mana: "produced", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
