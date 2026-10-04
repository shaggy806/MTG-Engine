import { defineCard } from "../define.js";
import { grantAffinity } from "../helpers.js";

// EDHREC rank 4658.
//
// Rulings:
//   [2025-07-25] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you’re paying, add any cost increases, then apply any cost reductions. The mana value
//     of the spell remains unchanged, no matter what the total cost to cast it was.
//   [2025-07-25] If a spell has multiple instances of affinity, each one applies. For example, if
//     you somehow control two Sami, Wildcat Captains and you control two artifacts, each spell you
//     cast will cost {4} less to cast.
//   [2025-07-25] Affinity for artifacts means “This spell costs {1} less to cast for each artifact
//     you control.”

const GRANT_TEXT =
  "Spells you cast have affinity for artifacts. (They cost {1} less to cast for each artifact you control.)";

export default defineCard({
  name: "Sami, Wildcat Captain",
  manaCost: "{4}{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer", "Rogue"],
  power: 4,
  toughness: 4,
  keywords: ["double-strike", "vigilance"],
  text: `Double strike, vigilance\n${GRANT_TEXT}`,
  // Every spell its controller casts (an empty filter matches any spell).
  static: [grantAffinity({}, { type: "artifact" }, GRANT_TEXT)],
});
