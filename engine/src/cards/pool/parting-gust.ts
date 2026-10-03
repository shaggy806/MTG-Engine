import { defineCard } from "../define.js";
import { GIFT_KICKER } from "../helpers.js";

// Gift a tapped Fish (rule 702.174f). Unpromised it's a blink to the next end
// step: the card comes back a new object (rule 400.7), under its owner's
// control, entering with the counter; a token exiled ceases to exist, which
// is why it targets a nontoken creature.
export default defineCard({
  name: "Parting Gust",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Gift a tapped Fish (You may promise an opponent a gift as you cast this spell. If you do, they create a tapped 1/1 blue Fish creature token before its other effects.)\n" +
    "Exile target nontoken creature. If the gift wasn't promised, return that card to the battlefield under its owner's control with a +1/+1 counter on it at the beginning of the next end step.",
  targets: [{ kind: "permanent", filter: { type: "creature", token: false } }],
  effect: {
    kind: "flicker",
    target: 0,
    thenCounters: { kind: "+1/+1", amount: 1, entering: true },
    returnAt: "next-end-step",
    returnText: "Return the exiled card to the battlefield under its owner's control with a +1/+1 counter on it.",
  },
  kicker: {
    ...GIFT_KICKER,
    effect: {
      kind: "sequence",
      effects: [
        { kind: "gift", gift: "tapped-fish" },
        { kind: "exile", target: 0 },
      ],
    },
  },
});
