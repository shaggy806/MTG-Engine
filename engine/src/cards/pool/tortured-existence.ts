import { defineCard } from "../define.js";

const TEXT = "{B}, Discard a creature card: Return target creature card from your graveyard to your hand.";

// The target is chosen before the cost is paid (rule 602.2b), so the card
// discarded can't be the one returned (its ruling).
export default defineCard({
  name: "Tortured Existence",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{B}", tap: false, discard: { count: 1, filter: { type: "creature" } } },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: TEXT,
    },
  ],
});
