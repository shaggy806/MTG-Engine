import { defineCard } from "../define.js";

// Top-commanders rank 401. Two mirrored cast triggers, both built from
// existing vocabulary: Sythis's `cast-spell` + `filter`-on-the-spell shape,
// paying out Edgar Markov's `add-counter-all` followed by Kenrith's
// `grant-keyword-all`.
//
// - "a white spell" / "a black spell" is a `colors` clause on the *spell*,
//   which `triggerFilterOk` reads off the stack object. `colors` means
//   "includes all of these", so a one-colour list is exactly "is white". A
//   white-black spell is both, and legitimately fires both triggers.
// - `otherOnly` is load-bearing on both, and Ardbert is the card that most
//   needs it: the spell a `spell-cast` event is about joins the trigger scan
//   with all of its abilities (that is how cascade sees its own cast), and
//   Ardbert is itself a white spell *and* a black spell. Without it he would
//   fire both triggers off his own cast from the stack, where rule 113.6 says
//   his abilities don't function at all.
// - "They" in the second sentence is the set the first sentence just put
//   counters on. Both halves run in one resolution off the same filter, so
//   they are the same permanents — a +1/+1 counter can't drop one out of the
//   set in between — and the grant lands only on what is there as the ability
//   resolves (rule 611.2c), not on a legend that enters later.
const WHITE_TEXT =
  "Whenever you cast a white spell, put a +1/+1 counter on each legendary creature you control. " +
  "They gain vigilance until end of turn.";
const BLACK_TEXT =
  "Whenever you cast a black spell, put a +1/+1 counter on each legendary creature you control. " +
  "They gain menace until end of turn.";

export default defineCard({
  name: "Ardbert, Warrior of Darkness",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${WHITE_TEXT}\n${BLACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", otherOnly: true, filter: { colors: ["W"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "add-counter-all",
            filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
            counter: "+1/+1",
            amount: 1,
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
            keyword: "vigilance",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: WHITE_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", otherOnly: true, filter: { colors: ["B"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "add-counter-all",
            filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
            counter: "+1/+1",
            amount: 1,
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
            keyword: "menace",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: BLACK_TEXT,
    },
  ],
});
