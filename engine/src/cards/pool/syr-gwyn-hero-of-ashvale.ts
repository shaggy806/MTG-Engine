import { defineCard } from "../define.js";

// "Equip Knight {0}" is an equip ability that can only target a Knight you
// control (rule 702.6a's "Equip [quality]"), granted to every Equipment you
// control on top of its own equip ability.
export default defineCard({
  name: "Syr Gwyn, Hero of Ashvale",
  manaCost: "{3}{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 5,
  toughness: 5,
  keywords: ["vigilance", "menace"],
  text:
    "Vigilance, menace\n" +
    "Whenever an equipped creature you control attacks, you draw a card and you lose 1 life.\n" +
    "Equipment you control have equip Knight {0}.",
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { equipped: true } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever an equipped creature you control attacks, you draw a card and you lose 1 life.",
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Equipment", controlledBy: "you" } },
      grantsActivated: [
        {
          cost: { mana: null, tap: false },
          targets: [
            {
              kind: "permanent",
              whose: "you",
              filter: { type: "creature", subtype: "Knight" },
            },
          ],
          effect: { kind: "attach", target: 0 },
          resolve: null,
          text: "Equip Knight {0}",
          sorcerySpeed: true,
        },
      ],
      text: "Equipment you control have equip Knight {0}.",
    },
  ],
});
