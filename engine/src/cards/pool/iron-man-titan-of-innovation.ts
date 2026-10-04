import { defineCard } from "../define.js";

const TEXT =
  "Genius Industrialist — Whenever Iron Man attacks, create a Treasure token, then you may sacrifice a " +
  "noncreature artifact. If you do, search your library for an artifact card with mana value equal to 1 " +
  "plus the sacrificed artifact's mana value, put it onto the battlefield tapped, then shuffle.";

// The Treasure just made may be the artifact sacrificed (mana value 0, so
// the search is for a mana value 1 artifact). "If you do" is the sacrifice
// actually made, whose mana value is read as it last existed. A search for
// a card with a stated quality may find nothing (rule 701.23d).
export default defineCard({
  name: "Iron Man, Titan of Innovation",
  manaCost: "{3}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Human", "Hero"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Treasure Token", count: 1 },
          {
            kind: "each-player-may",
            who: "you",
            options: [{ sacrifice: { type: "artifact", notTypes: ["creature"] }, text: "Sacrifice a noncreature artifact" }],
            ifDid: {
              kind: "search-library",
              filter: {
                type: "artifact",
                manaValue: { op: "eq", n: { amount: { sum: [{ manaValueOf: "sacrificed" }, 1] } } },
              },
              destination: "battlefield",
              enterTapped: true,
              min: 0,
              max: 1,
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
