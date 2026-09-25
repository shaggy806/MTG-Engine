import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// #214 in top-commanders.txt.
//
// The haste goes on the tokens this makes as they're made (`gainUntilEndOfTurn`),
// never on Goblins already there.
const TOKEN_TEXT =
  "Whenever you cast a noncreature spell, create X 1/1 red Phyrexian Goblin creature tokens, where " +
  "X is the mana value of that spell. They gain haste until end of turn.";
const WARD = ward({ mana: "{3}", payLife: 3 });

export default defineCard({
  name: "Ovika, Enigma Goliath",
  manaCost: "{5}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Nightmare"],
  power: 6,
  toughness: 6,
  keywords: ["flying"],
  text: `Flying\n${WARD.text}\n${TOKEN_TEXT}`,
  triggered: [
    WARD,
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Phyrexian Goblin Token",
        count: { manaValueOf: "trigger-object" },
        gainUntilEndOfTurn: ["haste"],
      },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
