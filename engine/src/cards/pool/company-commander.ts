import { defineCard } from "../define.js";

// EDHREC rank 6526.

const ENTER_TEXT =
  "Command Section — When this creature enters, create a number of 1/1 white Soldier creature tokens equal to the number of opponents you have.";
const ATTACK_TEXT = "Bring it Down! — Whenever this creature attacks, creatures you control gain deathtouch until end of turn.";

export default defineCard({
  name: "Company Commander",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 4,
  text: `${ENTER_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: { countPlayers: "each-opponent" } },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "deathtouch",
        duration: "end-of-turn",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
