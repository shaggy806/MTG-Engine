import { defineCard } from "../define.js";

// EDHREC rank 5283.

const COUNTERS_TEXT =
  "Whenever you cast your first Human creature spell each turn, that creature enters with an additional +1/+1 counter on it for each Dog and/or Wolf you control.";

export default defineCard({
  name: "Torgal, A Fine Hound",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Wolf"],
  power: 2,
  toughness: 2,
  text: `${COUNTERS_TEXT}\n{T}: Add one mana of any color.`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
  triggered: [
    {
      // The first *Human creature* spell, not the first spell (`filter` with
      // `firstEachTurn`). The spell is the trigger object; Yuna, Grand
      // Summoner's `enters-with-counters` marks it, counted as this resolves
      // — Torgal, a Wolf, among them.
      trigger: {
        on: "cast-spell",
        who: "you",
        firstEachTurn: true,
        filter: { subtype: "Human", type: "creature" },
      },
      targets: [],
      effect: {
        kind: "enters-with-counters",
        target: "trigger-object",
        counter: "+1/+1",
        amount: { countOf: { subtypes: ["Dog", "Wolf"], controlledBy: "you" } },
      },
      resolve: null,
      text: COUNTERS_TEXT,
    },
  ],
});
