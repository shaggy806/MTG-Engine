import { defineCard } from "../define.js";

// #411 in top-commanders.txt.
//
// A batched damage trigger, once per player the Rogues hit: that player
// mills the total they were dealt, and the draw asks what that mill did.
const LORD_TEXT = "Other Rogues you control get +1/+1.";
const MILL_TEXT =
  "Whenever one or more Rogues you control deal combat damage to a player, that player mills a card " +
  "for each 1 damage dealt to them. If the player mills at least one creature card this way, you draw " +
  "a card. (To mill a card, a player puts the top card of their library into their graveyard.)";

export default defineCard({
  name: "Anowon, the Ruin Thief",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Rogue"],
  power: 2,
  toughness: 4,
  text: `${LORD_TEXT}\n${MILL_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Rogue" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { subtype: "Rogue" }, combat: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "trigger-player", amount: { triggerValue: true } },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "milled", who: "trigger-player", filter: { type: "creature" } },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: MILL_TEXT,
    },
  ],
});
