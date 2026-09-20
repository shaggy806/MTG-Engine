import { defineCard } from "../define.js";

export default defineCard({
  name: "Seething Song",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Add {R}{R}{R}{R}{R}.",
  effect: { kind: "add-mana", mana: "R", amount: 5 },
});
