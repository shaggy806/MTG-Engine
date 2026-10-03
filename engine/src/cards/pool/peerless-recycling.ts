import { defineCard } from "../define.js";
import { GIFT_KICKER, distinctTargets } from "../helpers.js";

// Gift a card (rule 702.174e). A permanent card is any but an instant or a
// sorcery; promised, two different ones (rule 601.2c).
const PERMANENT_CARD = { kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["instant", "sorcery"] } } as const;

export default defineCard({
  name: "Peerless Recycling",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Gift a card (You may promise an opponent a gift as you cast this spell. If you do, they draw a card before its other effects.)\n" +
    "Return target permanent card from your graveyard to your hand. If the gift was promised, instead return two target permanent cards from your graveyard to your hand.",
  targets: [PERMANENT_CARD],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
  kicker: {
    ...GIFT_KICKER,
    targets: distinctTargets(2, PERMANENT_CARD),
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "card" },
        {
          kind: "sequence",
          simultaneous: true,
          effects: [
            { kind: "return-to-hand", target: 0, from: "graveyard" },
            { kind: "return-to-hand", target: 1, from: "graveyard" },
          ],
        },
      ],
    },
  },
});
