import { defineCard } from "../define.js";

export default defineCard({
  name: "Evacuation",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return all creatures to their owners' hands.",
  effect: { kind: "return-to-hand-all", filter: { type: "creature" } },
});
