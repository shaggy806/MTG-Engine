import { defineCard } from "../define.js";
import { affinity } from "../helpers.js";

export default defineCard({
  name: "Thoughtcast",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Affinity for artifacts (This spell costs {1} less to cast for each artifact you control.)\nDraw two cards.",
  selfCostReduction: affinity({ type: "artifact" }),
  effect: { kind: "draw", amount: 2 },
});
