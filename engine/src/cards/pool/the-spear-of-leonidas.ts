import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const ATTACK_TEXT = "Whenever equipped creature attacks, choose one —";
const BULL_RUSH = "Bull Rush — It gains double strike until end of turn.";
const SUMMON = "Summon — Create Phobos, a legendary 3/2 red Horse creature token.";
const REVELATION = "Revelation — Discard two cards, then draw two cards.";

// Revelation can be chosen with fewer than two cards in hand (the ruling).
export default defineCard({
  name: "The Spear of Leonidas",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${ATTACK_TEXT}\n• ${BULL_RUSH}\n• ${SUMMON}\n• ${REVELATION}\nEquip {2}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "attached" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: BULL_RUSH,
            effect: { kind: "grant-keyword", target: "trigger-object", keyword: "double-strike", duration: "end-of-turn" },
          },
          { text: SUMMON, effect: { kind: "create-token", token: "Phobos", count: 1 } },
          {
            text: REVELATION,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "discard", target: "you", amount: 2 },
                { kind: "draw", amount: 2 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: `${ATTACK_TEXT} ${BULL_RUSH} ${SUMMON} ${REVELATION}`,
    },
  ],
  activated: [equip("{2}")],
});
