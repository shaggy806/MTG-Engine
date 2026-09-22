import { defineCard } from "../define.js";

// The most-played commander in the format (#1 in top-commanders.txt), and the
// card the `turn-stat` condition was built for: "lost 4 or more life this
// turn" needs the amount, and `PlayerState` tracked only a boolean until now.
//
// `who: "any-player"` includes Y'shtola's own controller — the printed
// wording is "a player", not "an opponent", so your own life loss arms it.
const LOSE_TRIGGER_TEXT =
  "At the beginning of each end step, if a player lost 4 or more life this turn, you draw a card.";
const CAST_TRIGGER_TEXT =
  "Whenever you cast a noncreature spell with mana value 3 or greater, " +
  "Y'shtola deals 2 damage to each opponent and you gain 2 life.";

export default defineCard({
  name: "Y'shtola, Night's Blessed",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Warlock"],
  power: 2,
  toughness: 4,
  keywords: ["vigilance"],
  text: `Vigilance\n${LOSE_TRIGGER_TEXT}\n${CAST_TRIGGER_TEXT}`,
  triggered: [
    {
      // "each end step" — every player's, not just its controller's.
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-lost", who: "any-player", atLeast: 4 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: LOSE_TRIGGER_TEXT,
    },
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        // `notTypes` rather than `noncreatureOnly` so the mana-value clause
        // rides along in the same filter.
        filter: { notTypes: ["creature"], manaValue: { op: "gte", n: 3 } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 2, who: "each-opponent" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: CAST_TRIGGER_TEXT,
    },
  ],
});
