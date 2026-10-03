import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// Gift a card (rule 702.174e). "That creature" is the one put onto the
// battlefield this way, as it is there — a Clone that came back copying a
// legend is legendary — and the copy needs it to have arrived. The returned
// card keeps its id, so slot 0 still reaches it; triggers from both entering
// wait until it has finished resolving (the ruling).
const TEXT =
  "Return target creature card from your graveyard to the battlefield. Then if the gift was promised and that creature isn't legendary, create a token that's a copy of that creature, except it's 1/1.";

export default defineCard({
  name: "Coiling Rebirth",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Gift a card (You may promise an opponent a gift as you cast this spell. If you do, they draw a card before its other effects.)\n" +
    TEXT,
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
  kicker: {
    ...GIFT_KICKER,
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "card" },
        { kind: "put-onto-battlefield", target: 0 },
        {
          kind: "conditional",
          condition: { kind: "this-way", what: "put-onto-battlefield", filter: { notSupertype: "legendary" } },
          then: { kind: "create-token-copy", of: 0, count: 1, who: "you", basePt: [1, 1] },
        },
      ],
    },
  },
});
