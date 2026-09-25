import { defineCard } from "../define.js";

export default defineCard({
  name: "Aura Blast",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Destroy target enchantment.\nDraw a card.",
  targets: ["enchantment"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "draw", amount: 1 }] },
});
