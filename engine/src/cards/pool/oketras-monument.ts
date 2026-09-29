import { defineCard } from "../define.js";

const COST_TEXT = "White creature spells you cast cost {1} less to cast.";
const CAST_TEXT = "Whenever you cast a creature spell, create a 1/1 white Warrior creature token with vigilance.";

// The token comes for any creature spell, not only a white one, and resolves
// first — even if that spell is countered (the rulings).
export default defineCard({
  name: "Oketra's Monument",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${COST_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", colors: ["W"] },
        caster: "you",
        reduceGeneric: 1,
      },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Warrior Token (Vigilance)", count: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
