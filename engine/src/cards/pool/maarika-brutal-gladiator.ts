import { defineCard } from "../define.js";

// #410 in top-commanders.txt.
//
// Excess damage (rule 120.4a) is damage past what the creature needed to be
// destroyed — toughness less damage already marked, or 1 from a deathtouch
// source — and "this turn" includes the damage that set this off. The
// intervening "if" can't stop holding before the ability resolves, since
// having been dealt excess damage this turn never lapses within the turn;
// a creature the damage killed is asked as it last existed. "That creature's
// controller" is the one it had as it was dealt the damage.
const BLOCK_TEXT = "Maarika, Brutal Gladiator must be blocked if able.";
const TURN_TEXT = "As long as it's your turn, Maarika has indestructible.";
const DAMAGE_TEXT =
  "Whenever Maarika deals damage to a creature, if that creature was dealt excess damage this turn, that " +
  "creature's controller sacrifices a noncreature, nonland permanent.";

export default defineCard({
  name: "Maarika, Brutal Gladiator",
  manaCost: "{2}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 7,
  toughness: 4,
  text: `${BLOCK_TEXT}\n${TURN_TEXT}\n${DAMAGE_TEXT}`,
  static: [
    { affects: { scope: "self" }, restrictions: ["must-be-blocked-if-able"], text: BLOCK_TEXT },
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantKeywords: ["indestructible"],
      text: TURN_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-damage", who: "self", to: "creature", toFilter: { excessDamageThisTurn: true } },
      targets: [],
      effect: {
        kind: "sacrifice",
        who: "trigger-player",
        filter: { notTypes: ["creature", "land"] },
        count: 1,
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
