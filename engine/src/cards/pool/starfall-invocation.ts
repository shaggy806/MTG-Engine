import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// Gift a card (rule 702.174e). The creature card is chosen as it resolves
// (the ruling), from those the wrath put into your own graveyard — not one
// you controlled but didn't own, which went to its owner's.
export default defineCard({
  name: "Starfall Invocation",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Gift a card (You may promise an opponent a gift as you cast this spell. If you do, they draw a card before its other effects.)\n" +
    "Destroy all creatures. If the gift was promised, return a creature card put into your graveyard this way to the battlefield under your control.",
  effect: { kind: "destroy-all", filter: { type: "creature" } },
  kicker: {
    ...GIFT_KICKER,
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "card" },
        { kind: "destroy-all", filter: { type: "creature" } },
        {
          kind: "look-and-choose",
          zone: "graveyard",
          min: 1,
          max: 1,
          destination: "battlefield",
          leftover: "stay",
          filter: { type: "creature", thisWay: "put-into-graveyard" },
        },
      ],
    },
  },
});
