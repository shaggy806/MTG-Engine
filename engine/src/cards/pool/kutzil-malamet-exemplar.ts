import { defineCard } from "../define.js";

// "Greater than its base power": its power now against its base power — the
// printed value, one an effect set, or a characteristic-defining ability's
// (its rulings); a 0/0 that grows by a static bonus counts.
const LOCK_TEXT = "Your opponents can't cast spells during your turn.";
const DRAW_TEXT =
  "Whenever one or more creatures you control each with power greater than its base power deals combat damage " +
  "to a player, draw a card.";

export default defineCard({
  name: "Kutzil, Malamet Exemplar",
  manaCost: "{1}{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Warrior"],
  power: 3,
  toughness: 3,
  text: `${LOCK_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      prohibits: { who: "opponents", spells: true },
      text: LOCK_TEXT,
    },
  ],
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature", power: { op: "gt", n: { own: "basePower" } } },
        combat: true,
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
