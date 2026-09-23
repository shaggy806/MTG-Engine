import { defineCard } from "../define.js";

export default defineCard({
  name: "Omnath, Locus of Creation",
  manaCost: "{R}{G}{W}{U}",
  colors: ["R", "G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 4,
  toughness: 4,
  text:
    "When Omnath enters, draw a card.\n" +
    "Landfall — Whenever a land you control enters, you gain 4 life if this is the first time " +
    "this ability has resolved this turn. If it's the second time, add {R}{G}{W}{U}. If it's " +
    "the third time, Omnath deals 4 damage to each opponent and each planeswalker you don't control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Omnath enters, draw a card.",
    },
    {
      // A fourth resolution and every one after it does nothing (the
      // 2020-09-25 ruling). The ability still uses the stack, even the time
      // it adds mana: it's triggered by a land entering, not a mana ability.
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 1 },
            then: { kind: "gain-life", amount: 4 },
          },
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 2 },
            then: {
              kind: "sequence",
              effects: [
                { kind: "add-mana", mana: "R", amount: 1 },
                { kind: "add-mana", mana: "G", amount: 1 },
                { kind: "add-mana", mana: "W", amount: 1 },
                { kind: "add-mana", mana: "U", amount: 1 },
              ],
            },
          },
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 3 },
            then: {
              kind: "sequence",
              effects: [
                { kind: "damage", amount: 4, who: "each-opponent" },
                {
                  kind: "damage-all",
                  filter: { type: "planeswalker", controlledBy: "opponent" },
                  amount: 4,
                },
              ],
            },
          },
        ],
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, you gain 4 life if this is the first time " +
        "this ability has resolved this turn. If it's the second time, add {R}{G}{W}{U}. If it's " +
        "the third time, Omnath deals 4 damage to each opponent and each planeswalker you don't control.",
    },
  ],
});
