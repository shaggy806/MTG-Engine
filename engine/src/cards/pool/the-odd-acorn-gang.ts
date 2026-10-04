import { defineCard } from "../define.js";

// EDHREC rank 4630.
//
// The granted ability is Ragost's `grantsActivated` shape over Squirrels you
// control (this one included); the pump is Rhonas's Monument's.

const GRANTED = "{T}: Target Squirrel gets +2/+2 and gains trample until end of turn. Activate only as a sorcery.";
const GRANT_TEXT = `Squirrels you control have "${GRANTED}"`;
const DRAW_TEXT = "Whenever one or more Squirrels you control deal combat damage to a player, draw a card.";

export default defineCard({
  name: "The Odd Acorn Gang",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Squirrel", "Warrior"],
  power: 5,
  toughness: 5,
  keywords: ["reach", "menace", "trample"],
  text: `Reach, menace, trample\n${GRANT_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Squirrel", controlledBy: "you" } },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [{ kind: "permanent", filter: { subtype: "Squirrel" } }],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
              { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
            ],
          },
          resolve: null,
          text: GRANTED,
          sorcerySpeed: true,
        },
      ],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { subtype: "Squirrel" }, combat: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
