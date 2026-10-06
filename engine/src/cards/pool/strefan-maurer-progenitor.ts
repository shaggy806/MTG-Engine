import { defineCard } from "../define.js";

// Rulings:
//   [2021-11-19] Strefan's first triggered ability counts the number of players that lost any
//     amount of life, even if they also gained that much or more life this turn.
//
// The count is `playersWithTurnStat: "life-lost"` over every player, Strefan's
// controller too. The attack trigger is an `each-player-may` of the
// controller alone: "sacrifice two Blood tokens" is offered only to a player
// with two (rule 118.3), and its `ifDid` is the "if you do" — a second "you
// may" (`min: 0`) putting a Vampire card onto the battlefield tapped and
// attacking a player or planeswalker its controller chooses (rule 508.4),
// which then gains indestructible until end of turn ("it": the card put onto
// the battlefield this way).
const END_TEXT = "At the beginning of your end step, create a Blood token for each player who lost life this turn.";
const ATTACK_TEXT =
  "Whenever Strefan attacks, you may sacrifice two Blood tokens. If you do, you may put a Vampire card from your hand onto the battlefield tapped and attacking. It gains indestructible until end of turn.";

export default defineCard({
  name: "Strefan, Maurer Progenitor",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Noble"],
  power: 3,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${END_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Blood Token",
        count: { playersWithTurnStat: "life-lost", who: "each-player" },
      },
      resolve: null,
      text: END_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "you",
        options: [{ sacrifice: { subtype: "Blood", token: true }, count: 2, text: "Sacrifice two Blood tokens" }],
        ifDid: {
          kind: "sequence",
          effects: [
            {
              kind: "look-and-choose",
              zone: "hand",
              min: 0,
              max: 1,
              destination: "battlefield",
              leftover: "stay",
              filter: { subtypes: ["Vampire"] },
              enterTapped: true,
              attacking: "choose",
            },
            {
              kind: "grant-keyword-all",
              filter: { thisWay: "put-onto-battlefield" },
              keyword: "indestructible",
              duration: "end-of-turn",
            },
          ],
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
