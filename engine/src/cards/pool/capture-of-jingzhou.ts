import { defineCard } from "../define.js";

// EDHREC rank 5124.

export default defineCard({
  name: "Capture of Jingzhou",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Take an extra turn after this one.",
  effect: { kind: "take-extra-turn" },
});
