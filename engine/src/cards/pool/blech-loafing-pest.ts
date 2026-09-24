import { defineCard } from "../define.js";

// #186 in top-commanders.txt.
//
// "Whenever you gain life" triggers once per life-gain *event* (rule 119.9 —
// once per source that caused it): one lifelink creature hitting a blocker
// and the player at once gains life once, two lifelinkers gain it twice.
// `Game.withDamageBatch` is what makes lifelink count that way; it was the
// reason this card was once dropped.
//
// The five types are matched as plain subtypes, with no creature-type
// restriction, because that's the wording: "each Pest, Bat, …" is any
// permanent with the subtype. It's exact because nothing in the pool or
// tokens has changeling (rule 702.73a). A creature with two of the types
// matches once, so it gets one counter (the 2026-03-20 ruling).
const TEXT =
  "Whenever you gain life, put a +1/+1 counter on each Pest, Bat, Insect, Snake, and " +
  "Spider you control.";

export default defineCard({
  name: "Blech, Loafing Pest",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Pest"],
  power: 3,
  toughness: 4,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: {
          subtypes: ["Pest", "Bat", "Insect", "Snake", "Spider"],
          controlledBy: "you",
        },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
