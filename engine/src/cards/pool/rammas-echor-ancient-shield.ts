import { defineCard } from "../define.js";

// EDHREC rank 4370.
// Makes Wall → new token "Wall Token (Rammas Echor, Ancient Shield)" (scaffolded).
//
// Rulings:
//   [2023-11-03] If Rammas Echor was the second spell you cast in a turn, its first ability won't
//     trigger that turn.
//   [2023-11-03] A creature attacks alone if it's the only creature declared as an attacker during
//     the declare attackers step (including creatures controlled by your teammates, if
//     applicable). For example, exalted won't trigger if you attack with multiple creatures and
//     all but one of them are removed from combat.
//   [2023-11-03] Spells that were cast before Rammas Echor, Ancient Shield entered the battlefield
//     count. If Rammas Echor was the first spell you cast in a turn, the next spell you cast that
//     turn is your second spell.

const SECOND_SPELL_TEXT =
  "Whenever you cast your second spell each turn, draw a card, then create a 0/3 white Wall creature token with defender.";
const EXALTED_TEXT =
  "At the beginning of combat on your turn, creatures you control with defender gain exalted until end of turn. (Whenever a creature you control attacks alone, it gets +1/+1 until end of turn for each instance of exalted among permanents you control.)";

export default defineCard({
  name: "Rammas Echor, Ancient Shield",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${SECOND_SPELL_TEXT}\n${EXALTED_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "create-token", token: "Wall Token (Rammas Echor, Ancient Shield)", count: 1 },
        ],
      },
      resolve: null,
      text: SECOND_SPELL_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      // Exalted (rule 702.83) is Noble Hierarch's trigger; each creature that
      // gains it is one instance, and each instance triggers on its own. The
      // creatures are the ones with defender as this resolves (rule 611.2c).
      effect: {
        kind: "grant-triggered-all",
        filter: { type: "creature", controlledBy: "you", keyword: "defender" },
        ability: {
          trigger: { on: "attacks-alone", who: "you-control" },
          targets: [],
          effect: { kind: "modify-pt", target: "trigger-object", power: 1, toughness: 1, duration: "end-of-turn" },
          resolve: null,
          text: "Exalted (Whenever a creature you control attacks alone, that creature gets +1/+1 until end of turn.)",
        },
        duration: "end-of-turn",
      },
      resolve: null,
      text: EXALTED_TEXT,
    },
  ],
});
