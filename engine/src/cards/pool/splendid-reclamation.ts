import { defineCard } from "../define.js";

export default defineCard({
  name: "Splendid Reclamation",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Return all land cards from your graveyard to the battlefield tapped.",
  effect: {
    kind: "return-from-graveyard",
    filter: { type: "land" },
    destination: "battlefield",
    count: "all",
    enterTapped: true,
  },
});
