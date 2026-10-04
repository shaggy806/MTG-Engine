import { defineCard } from "../define.js";

// EDHREC rank 4231.
//
// Rulings:
//   [2026-06-29] Once a spell or ability that causes you to recruit begins to resolve, no player
//     may take any other actions until it's done. Any responses made to the spell or ability must
//     be made before you draw, discard, and potentially create a token.
//   [2026-06-29] If a noncreature spell was already cast by an opponent the turn The Queen of Dale
//     enters, that opponent already cast their first noncreature spell this turn, and The Queen of
//     Dale's ability won't trigger for that opponent that turn.
//
// "Their first noncreature spell" counts that opponent's matching spells (a
// `filter`, as Esper Sentinel), not their first spell of any kind. Recruit is
// draw, then discard, then a token if the discarded card was nonland (Lord
// Windgrace's `this-way` discard filter).

const TEXT = "Whenever an opponent casts their first noncreature spell each turn, you recruit.";

export default defineCard({
  name: "The Queen of Dale",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble"],
  power: 2,
  toughness: 1,
  text: `${TEXT} (Draw a card, then discard a card. If you discarded a nonland card, create a 1/1 white Human Soldier creature token.)`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", firstEachTurn: true, filter: { notTypes: ["creature"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "discarded", filter: { notTypes: ["land"] } },
            then: { kind: "create-token", token: "Human Soldier Token", count: 1 },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
