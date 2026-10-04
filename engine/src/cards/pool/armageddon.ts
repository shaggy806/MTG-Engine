import { defineCard } from "../define.js";

// EDHREC rank 4052.

export default defineCard({
  name: "Armageddon",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all lands.",
  effect: { kind: "destroy-all", filter: { type: "land" } },
});
