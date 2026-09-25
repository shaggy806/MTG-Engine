import { defineCard } from "../define.js";

const DEATHTOUCH_TEXT = "Attacking creatures you control have deathtouch.";
const DRAW_TEXT = "Whenever a creature you control deals combat damage to a player, draw a card.";

export default defineCard({
  name: "Ohran Frostfang",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["snow"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 6,
  text: `${DEATHTOUCH_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", attacking: true } },
      grantKeywords: ["deathtouch"],
      text: DEATHTOUCH_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
