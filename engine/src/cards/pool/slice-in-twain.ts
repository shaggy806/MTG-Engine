import { defineCard } from "../define.js";

export default defineCard({
  name: "Slice in Twain",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment.\nDraw a card.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "draw", amount: 1 }] },
});
