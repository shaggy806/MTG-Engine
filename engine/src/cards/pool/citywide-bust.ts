import { defineCard } from "../define.js";

export default defineCard({
  name: "Citywide Bust",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures with toughness 4 or greater.",
  effect: {
    kind: "destroy-all",
    filter: { type: "creature", toughness: { op: "gte", n: 4 } },
  },
});
