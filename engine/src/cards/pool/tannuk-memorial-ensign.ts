import { defineCard } from "../define.js";

export default defineCard({
  name: "Tannuk, Memorial Ensign",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kavu", "Pilot"],
  power: 2,
  toughness: 4,
  text:
    "Landfall — Whenever a land you control enters, Tannuk deals 1 damage to each opponent. " +
    "If this is the second time this ability has resolved this turn, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 1, who: "each-opponent" },
          {
            kind: "conditional",
            condition: { kind: "resolved-this-turn", n: 2 },
            then: { kind: "draw", amount: 1 },
          },
        ],
      },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, Tannuk deals 1 damage to each opponent. " +
        "If this is the second time this ability has resolved this turn, draw a card.",
    },
  ],
});
