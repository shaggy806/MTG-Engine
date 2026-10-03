import { defineCard } from "../define.js";
import { GIFT_KICKER, giftTrigger } from "../helpers.js";

// Gift an Octopus (rule 702.174i). The end-step copy copies the token as its
// creating effect made it — or what it was copying — with none of its
// counters or other changes (rule 707.2, the rulings); it targets, so with no
// creature token that entered this turn there's nothing to copy.
const COPY_TEXT =
  "At the beginning of each end step, create a token that's a copy of target creature token that entered the battlefield this turn.";

export default defineCard({
  name: "Octomancer",
  manaCost: "{3}{G}{U}",
  colors: ["G", "U"],
  types: ["creature"],
  subtypes: ["Frog", "Druid"],
  power: 3,
  toughness: 3,
  text:
    "Gift an Octopus (You may promise an opponent a gift as you cast this spell. If you do, when it enters, they create an 8/8 blue Octopus creature token.)\n" +
    COPY_TEXT,
  kicker: GIFT_KICKER,
  triggered: [
    giftTrigger("octopus"),
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [{ kind: "permanent", filter: { type: "creature", token: true, enteredThisTurn: true } }],
      effect: { kind: "create-token-copy", of: 0, count: 1, who: "you" },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
