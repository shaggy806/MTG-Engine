import { defineCard } from "../define.js";
import { affinity, grantAffinity } from "../helpers.js";

// EDHREC rank 3349.
//
// Rulings:
//   [2004-12-01] The spells gain affinity for artifacts as they’re put onto the stack. They don’t
//     have the ability while they’re cards in your hand.
//   [2004-12-01] Two or more instances of the affinity ability are cumulative, even if they’re
//     both affinity for the same thing.
//   [2004-12-01] If Mycosynth Golem is sacrificed as part of the cost to cast a spell, the cost
//     reduction will already be locked in, and the cost won’t be increased.

const GRANT_TEXT =
  "Artifact creature spells you cast have affinity for artifacts. (They cost {1} less to cast for each artifact you control.)";

export default defineCard({
  name: "Mycosynth Golem",
  manaCost: "{11}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Golem"],
  power: 4,
  toughness: 5,
  selfCostReduction: affinity({ type: "artifact" }),
  text: `Affinity for artifacts (This spell costs {1} less to cast for each artifact you control.)\n${GRANT_TEXT}`,
  static: [grantAffinity({ types: ["artifact", "creature"] }, { type: "artifact" }, GRANT_TEXT)],
});
