import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// Gift a card (rule 702.174e): promised, the chosen opponent draws a card
// before anything else it does (702.174j). Countered, no gift (the ruling).
// "Permanents you control" is every one, not only creatures.
const BASE_TEXT = "You and permanents you control gain hexproof until end of turn.";

export default defineCard({
  name: "Dawn's Truce",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Gift a card (You may promise an opponent a gift as you cast this spell. If you do, they draw a card before its other effects.)\n" +
    `${BASE_TEXT} If the gift was promised, permanents you control also gain indestructible until end of turn.`,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-player-hexproof", who: "you" },
      { kind: "grant-keyword-all", filter: { controlledBy: "you" }, keyword: "hexproof", duration: "end-of-turn" },
    ],
  },
  kicker: {
    ...GIFT_KICKER,
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "card" },
        { kind: "grant-player-hexproof", who: "you" },
        { kind: "grant-keyword-all", filter: { controlledBy: "you" }, keyword: "hexproof", duration: "end-of-turn" },
        {
          kind: "grant-keyword-all",
          filter: { controlledBy: "you" },
          keyword: "indestructible",
          duration: "end-of-turn",
        },
      ],
    },
  },
});
