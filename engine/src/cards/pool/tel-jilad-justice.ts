import { defineCard } from "../define.js";

export default defineCard({
  name: "Tel-Jilad Justice",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact. Scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  targets: ["artifact"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "scry", amount: 2 }] },
});
