import { defineCard } from "../define.js";

export default defineCard({
  name: "Blazing Volley",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Blazing Volley deals 1 damage to each creature your opponents control.",
  effect: { kind: "damage-all", amount: 1, filter: { type: "creature", controlledBy: "opponent" } },
});
