import { defineCard } from "../define.js";

export default defineCard({
  name: "Day of Judgment",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures.",
  effect: { kind: "destroy-all", filter: { type: "creature" } },
});
