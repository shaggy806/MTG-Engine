import { defineCard } from "../define.js";

// The Adventure half of Cruel Somnophage (EDHREC rank 4979).

export default defineCard({
  name: "Can't Wake Up",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text: "Target player mills four cards. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: 4 },
  faces: ["Cruel Somnophage", "Can't Wake Up"],
  adventure: true,
});
