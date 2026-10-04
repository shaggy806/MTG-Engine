import { defineCard } from "../define.js";

// EDHREC rank 3556.
//
// Rulings:
//   [2019-07-12] If the target Elemental is an illegal target by the time Omnath's second ability
//     tries to resolve, the ability doesn't resolve. You don't draw a card if you control eight or
//     more lands. If the target is legal but can't have a +1/+1 counter put on it (most likely
//     because an opponent controls Blightbeetle), you do draw a card if you control eight or more
//     lands.
//   [2019-07-12] You may choose Omnath as the target of its own second ability.
//   [2019-07-12] The number of Elementals you control is counted as Omnath's first ability
//     resolves. If Omnath is still on the battlefield, it will count itself.

const ETB_TEXT = "When Omnath enters, it deals damage to any target equal to the number of Elementals you control.";
const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, put a +1/+1 counter on target Elemental you control. If you control eight or more lands, draw a card.";

export default defineCard({
  name: "Omnath, Locus of the Roil",
  manaCost: "{1}{G}{U}{R}",
  colors: ["U", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 3,
  text: `${ETB_TEXT}\n${LANDFALL_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["any-target"],
      // Counted as it resolves (the ruling).
      effect: { kind: "damage", target: 0, amount: { countOf: { subtype: "Elemental", controlledBy: "you" } } },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [{ kind: "permanent", whose: "you", filter: { subtype: "Elemental" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { type: "land" }, atLeast: 8 },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
