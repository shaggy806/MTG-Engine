import { defineCard } from "../define.js";

// #194 in top-commanders.txt.
//
// "Put it onto the battlefield" finds the card only in the graveyard it was
// put into (rule 400.7).
const LHURGOYF_TEXT =
  "Whenever a Lhurgoyf permanent card is put into your graveyard from anywhere other than the " +
  "battlefield, put it onto the battlefield.";
const TOKEN_TEXT = "Whenever one or more creatures you control deal combat damage to a player, create a Tarmogoyf token.";

export default defineCard({
  name: "Disa the Restless",
  manaCost: "{2}{B}{R}{G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 5,
  toughness: 6,
  text: `${LHURGOYF_TEXT}\n${TOKEN_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "put-into-graveyard",
        who: "you",
        notFrom: "battlefield",
        filter: {
          subtype: "Lhurgoyf",
          typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
        },
      },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "trigger-object" },
      resolve: null,
      text: LHURGOYF_TEXT,
    },
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { type: "creature" }, combat: true },
      targets: [],
      effect: { kind: "create-token", token: "Tarmogoyf Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
