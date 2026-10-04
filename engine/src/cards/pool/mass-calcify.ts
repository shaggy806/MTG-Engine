import { defineCard } from "../define.js";

// EDHREC rank 4210.

export default defineCard({
  name: "Mass Calcify",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all nonwhite creatures.",
  effect: { kind: "destroy-all", filter: { type: "creature", notColors: ["W"] } },
});
