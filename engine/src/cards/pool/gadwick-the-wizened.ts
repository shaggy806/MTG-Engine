import { defineCard } from "../define.js";

// Rulings:
//   [2019-10-04] If Gadwick enters the battlefield without being cast, or if it was cast for a
//     cost other than its mana cost, the value of X for its first ability is 0.
//   [2019-10-04] Gadwick's second ability resolves before the spell that caused it to trigger.
//
// X is the X it was cast with (Farmer Cotton's shape); 0 if it entered without being cast.
const ENTER_TEXT = "When Gadwick enters, draw X cards.";
const TAP_TEXT = "Whenever you cast a blue spell, tap target nonland permanent an opponent controls.";

export default defineCard({
  name: "Gadwick, the Wizened",
  manaCost: "{X}{U}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 3,
  text: `${ENTER_TEXT}\n${TAP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: "x" },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { colors: ["U"] } },
      targets: ["nonland-permanent-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: TAP_TEXT,
    },
  ],
});
