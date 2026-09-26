import { defineCard } from "../define.js";

// #196 in top-commanders.txt.
//
// Rulings:
//   [2020-11-10] If either the opponent or the permanent you control becomes an illegal target by
//     the time Zedruu's last ability tries to resolve, the ability does nothing.
//     (`gain-control` does nothing when either slot is in `illegalTargets`, rule 608.2b.)
//   [2020-11-10] If you leave the game, all permanents you own leave the game with you.
//   [2020-11-10] If an opponent leaves the game, all permanents you gave to them courtesy of
//     Zedruu will return to your control. (The effect giving them control ends, rule 800.4a.)

const UPKEEP_TEXT =
  "At the beginning of your upkeep, you gain X life and draw X cards, where X is the number of " +
  "permanents you own that your opponents control.";
const DONATE_TEXT = "{U}{R}{W}: Target opponent gains control of target permanent you control.";
/** Permanents you own that your opponents control — a token stack counts
 * every token in it. */
const given = { countOf: { ownedBy: "you", controlledBy: "opponent" } } as const;

export default defineCard({
  name: "Zedruu the Greathearted",
  manaCost: "{1}{U}{R}{W}",
  colors: ["W", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Minotaur", "Monk"],
  power: 2,
  toughness: 4,
  text: `${UPKEEP_TEXT}\n${DONATE_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: given },
          { kind: "draw", amount: given },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{U}{R}{W}", tap: false },
      targets: ["opponent", { kind: "permanent", whose: "you", filter: {} }],
      effect: { kind: "gain-control", target: 1, who: { target: 0 }, untilEndOfTurn: false },
      resolve: null,
      text: DONATE_TEXT,
    },
  ],
});
