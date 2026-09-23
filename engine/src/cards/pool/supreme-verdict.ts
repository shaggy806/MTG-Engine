import { defineCard } from "../define.js";

export default defineCard({
  name: "Supreme Verdict",
  manaCost: "{1}{W}{W}{U}",
  colors: ["W", "U"],
  types: ["sorcery"],
  text: "This spell can't be countered.\nDestroy all creatures.",
  cantBeCountered: true,
  effect: { kind: "destroy-all", filter: { type: "creature" } },
});
