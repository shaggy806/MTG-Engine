import { defineCard } from "../define.js";

// EDHREC rank 3087.

const COMBAT_TEXT =
  "At the beginning of combat on your turn, create a 2/1 red Elemental creature token with trample and haste. " +
  "Sacrifice it at the beginning of the next end step.";
const TUTOR_TEXT =
  "{T}: Search your library for a card, put it into your hand, then shuffle. " +
  "Activate only if five or more creatures died this turn.";

export default defineCard({
  name: "Lagomos, Hand of Hatred",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 3,
  text: `${COMBAT_TEXT}\n${TUTOR_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      // Creatures that died under any player's control this turn.
      condition: { kind: "turn-history", what: "died", who: "any-player", filter: { type: "creature" }, atLeast: 5 },
      targets: [],
      // "A card", no quality: one must be found while there is one (701.23d).
      effect: { kind: "search-library", filter: {}, destination: "hand", min: 1, max: 1 },
      resolve: null,
      text: TUTOR_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      // `sacrificeAtEndStep` is AUTHORING §6's shape for "create a token, then
      // sacrifice it at the beginning of the next end step" (§15 "Partial").
      effect: {
        kind: "create-token",
        token: "Elemental Token (Lagomos, Hand of Hatred)",
        count: 1,
        sacrificeAtEndStep: true,
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
