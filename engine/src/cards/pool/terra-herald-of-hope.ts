import { defineCard } from "../define.js";

// #85 in top-commanders.txt.
const TRANCE_TEXT =
  "Trance — At the beginning of combat on your turn, mill two cards. Terra gains flying until end of turn.";
const RETURN_TEXT =
  "When you do, return target creature card with power 3 or less from your graveyard to the " +
  "battlefield tapped.";
const DAMAGE_TEXT = `Whenever Terra deals combat damage to a player, you may pay {2}. ${RETURN_TEXT}`;

export default defineCard({
  name: "Terra, Herald of Hope",
  manaCost: "{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard", "Warrior"],
  power: 3,
  toughness: 3,
  text: `${TRANCE_TEXT}\n${DAMAGE_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 2 },
          { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: TRANCE_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {2} to return a creature card with power 3 or less?",
        cost: "{2}",
        effect: {
          kind: "reflexive-trigger",
          targets: [
            { kind: "card-in-graveyard", whose: "you", filter: { type: "creature", power: { op: "lte", n: 3 } } },
          ],
          effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
          text: RETURN_TEXT,
        },
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
