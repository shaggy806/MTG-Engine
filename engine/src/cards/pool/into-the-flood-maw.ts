import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// Gift a tapped Fish (rule 702.174f). Its target depends on the promise, so
// the promise is made before targets are chosen (702.174m — the kicked
// variant's own target).
export default defineCard({
  name: "Into the Flood Maw",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Gift a tapped Fish (You may promise an opponent a gift as you cast this spell. If you do, they create a tapped 1/1 blue Fish creature token before its other effects.)\n" +
    "Return target creature an opponent controls to its owner's hand. If the gift was promised, instead return target nonland permanent an opponent controls to its owner's hand.",
  targets: ["creature-an-opponent-controls"],
  effect: { kind: "return-to-hand", target: 0 },
  kicker: {
    ...GIFT_KICKER,
    targets: ["nonland-permanent-an-opponent-controls"],
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "tapped-fish" },
        { kind: "return-to-hand", target: 0 },
      ],
    },
  },
});
