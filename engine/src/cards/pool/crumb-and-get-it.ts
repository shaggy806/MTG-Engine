import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// EDHREC rank 6299.
// Gift a Food (rule 702.174g) — Dawn's Truce's shape: promised, the chosen opponent creates
// a Food before anything else it does (702.174j). Countered or fizzled, no gift (the ruling).

const PUMP = { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" } as const;

export default defineCard({
  name: "Crumb and Get It",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Gift a Food (You may promise an opponent a gift as you cast this spell. If you do, they create a Food token before its other effects. It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")\nTarget creature you control gets +2/+2 until end of turn. If the gift was promised, that creature also gains indestructible until end of turn.",
  targets: ["creature-you-control"],
  effect: PUMP,
  kicker: {
    ...GIFT_KICKER,
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "food" },
        PUMP,
        { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
      ],
    },
  },
});
