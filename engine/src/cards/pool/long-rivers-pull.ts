import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// Gift a card (rule 702.174e); promised, its target is any spell (702.174m).
export default defineCard({
  name: "Long River's Pull",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Gift a card (You may promise an opponent a gift as you cast this spell. If you do, they draw a card before its other effects.)\n" +
    "Counter target creature spell. If the gift was promised, instead counter target spell.",
  targets: ["creature-spell"],
  effect: { kind: "counter", target: 0 },
  kicker: {
    ...GIFT_KICKER,
    targets: ["spell"],
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "card" },
        { kind: "counter", target: 0 },
      ],
    },
  },
});
