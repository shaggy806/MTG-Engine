import { defineCard } from "../define.js";

export default defineCard({
  name: "Artisan's Sorrow",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment. Scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "scry", amount: 2 }] },
});
