import { defineCard } from "../define.js";

export default defineCard({
  name: "Dark Ritual",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Add {B}{B}{B}.",
  effect: { kind: "add-mana", mana: "B", amount: 3 },
});
