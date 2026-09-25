import { defineCard } from "../define.js";

export default defineCard({
  name: "Opportunity",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target player draws four cards.",
  targets: ["player"],
  effect: { kind: "draw", amount: 4, target: 0 },
});
