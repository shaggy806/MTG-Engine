import { defineCard } from "../define.js";

// EDHREC rank 2601.
//
// Rulings:
//   [2017-03-14] No abilities of creatures your opponents control can be activated, including mana
//     abilities.
//   [2017-03-14] Linvala's last ability affects only creatures on the battlefield. Activated
//     abilities that work in other zones (such as bloodrush or unearth) can still be activated.
//     Triggered abilities (starting with "when," "whenever," or "at") are unaffected.

const SILENCE_TEXT = "Activated abilities of creatures your opponents control can't be activated.";

export default defineCard({
  name: "Linvala, Keeper of Silence",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${SILENCE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      // Nobody may activate them: the filter is read from Linvala's
      // controller's side, so "creatures your opponents control". Mana
      // abilities included; a prohibition reaches battlefield permanents only
      // (the rulings: unearth, bloodrush still work).
      prohibits: {
        who: "each-player",
        abilitiesOf: { type: "creature", controlledBy: "opponent" },
      },
      text: SILENCE_TEXT,
    },
  ],
});
