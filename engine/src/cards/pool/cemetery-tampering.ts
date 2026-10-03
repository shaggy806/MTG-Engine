import { defineCard } from "../define.js";
import { hideaway, playHideawayCard } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this enchantment
// (607.2a). "Then if there are twenty or more cards in your graveyard" is
// checked as the trigger resolves, after the mill (taken or not).
const UPKEEP_TEXT =
  "At the beginning of your upkeep, you may mill three cards. Then if there are twenty or more cards in your graveyard, you may play the exiled card without paying its mana cost.";

export default defineCard({
  name: "Cemetery Tampering",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text:
    "Hideaway 5 (When this enchantment enters, look at the top five cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    UPKEEP_TEXT,
  triggered: [
    hideaway(5, "enchantment"),
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "may", prompt: "Mill three cards?", effect: { kind: "mill", target: "you", amount: 3 } },
          {
            kind: "conditional",
            condition: { kind: "cards-in-graveyard", atLeast: 20 },
            then: playHideawayCard(),
          },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
