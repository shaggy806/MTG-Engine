import { defineCard } from "../define.js";
import { affinity } from "../helpers.js";

// EDHREC rank 5640.

export default defineCard({
  name: "Myr Enforcer",
  manaCost: "{7}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 4,
  toughness: 4,
  text: "Affinity for artifacts (This spell costs {1} less to cast for each artifact you control.)",
  selfCostReduction: affinity({ type: "artifact" }),
});
