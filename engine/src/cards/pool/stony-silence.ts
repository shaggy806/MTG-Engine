import { defineCard } from "../define.js";

// EDHREC rank 6171.
//
// Rulings:
//   [2017-03-14] No abilities of artifacts can be activated, including mana abilities.
//   [2017-03-14] Stony Silence's ability affects only artifacts on the battlefield. Activated
//     abilities that work in other zones (such as cycling) can still be activated. Triggered
//     abilities (starting with "when," "whenever," or "at") are unaffected.
// Collector Ouphe's static, exactly.

const TEXT = "Activated abilities of artifacts can't be activated.";

export default defineCard({
  name: "Stony Silence",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "self" },
      prohibits: { who: "each-player", abilitiesOf: { type: "artifact" } },
      text: TEXT,
    },
  ],
});
