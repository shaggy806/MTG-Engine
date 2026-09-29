import { defineCard } from "../define.js";

export default defineCard({
  name: "In Garruk's Wake",
  manaCost: "{7}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy all creatures you don't control and all planeswalkers you don't control.",
  effect: {
    kind: "destroy-all",
    filter: { typesAnyOf: ["creature", "planeswalker"], controlledBy: "opponent" },
  },
});
