import { defineCard } from "../define.js";

// EDHREC rank 5027.

export default defineCard({
  name: "Slash the Ranks",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures and planeswalkers except for commanders.",
  effect: {
    kind: "destroy-all",
    filter: { typesAnyOf: ["creature", "planeswalker"], isCommander: false },
  },
});
