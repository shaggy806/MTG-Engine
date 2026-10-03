import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// Gift a tapped Fish (rule 702.174f). The creature is a target only when the
// gift is promised (702.174m), so it can be cast unpromised without one.
// The discard is a mandatory additional cost, paid either way.
export default defineCard({
  name: "Sazacap's Brew",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Gift a tapped Fish (You may promise an opponent a gift as you cast this spell. If you do, they create a tapped 1/1 blue Fish creature token before its other effects.)\n" +
    "As an additional cost to cast this spell, discard a card.\n" +
    "Target player draws two cards. If the gift was promised, target creature you control gets +2/+0 until end of turn.",
  additionalCost: { discard: 1 },
  targets: ["player"],
  effect: { kind: "draw", amount: 2, target: 0 },
  kicker: {
    ...GIFT_KICKER,
    targets: ["player", "creature-you-control"],
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "tapped-fish" },
        { kind: "draw", amount: 2, target: 0 },
        { kind: "modify-pt", target: 1, power: 2, toughness: 0, duration: "end-of-turn" },
      ],
    },
  },
});
