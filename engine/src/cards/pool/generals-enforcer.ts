import { defineCard } from "../define.js";

// EDHREC rank 3431.
//
// Rulings:
//   [2020-04-17] Because damage remains marked on a creature until the damage is removed as the
//     turn ends, nonlethal damage dealt to a legendary Human you control may become lethal if
//     General's Enforcer leaves the battlefield during that turn.
//   [2020-04-17] Only creatures are Humans. Planeswalkers such as Lukka and Narset who represent
//     human characters aren't affected by General's Enforcer.

const STATIC_TEXT = "Legendary Humans you control have indestructible.";
const EXILE_TEXT =
  "{2}{W}{B}: Exile target card from a graveyard. If it was a creature card, create a 1/1 white Human Soldier creature token.";

export default defineCard({
  name: "General's Enforcer",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 3,
  text: `${STATIC_TEXT}\n${EXILE_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Human", supertype: "legendary", controlledBy: "you" } },
      grantKeywords: ["indestructible"],
      text: STATIC_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{W}{B}", tap: false },
      targets: [{ kind: "card-in-graveyard" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          {
            // "If it was a creature card" — Scavenging Ooze's shape: the
            // filter reads printed characteristics, unchanged by the exile.
            kind: "conditional",
            condition: { kind: "target", index: 0, filter: { type: "creature" } },
            then: { kind: "create-token", token: "Human Soldier Token", count: 1 },
          },
        ],
      },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
});
