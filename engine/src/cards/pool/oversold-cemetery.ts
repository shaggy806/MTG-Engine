import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your upkeep, if you have four or more creature cards in your graveyard, you may return target creature card from your graveyard to your hand.";

// An intervening-if (rule 603.4): four creature cards as the upkeep begins
// and again as it resolves — the target among them.
export default defineCard({
  name: "Oversold Cemetery",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      condition: { kind: "cards-in-graveyard", atLeast: 4, filter: { type: "creature" } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "may",
        prompt: "Return that creature card to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
