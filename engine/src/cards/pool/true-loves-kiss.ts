import { defineCard } from "../define.js";

export default defineCard({
  name: "True Love's Kiss",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Exile target artifact or enchantment.\nDraw a card.",
  targets: ["artifact-or-enchantment"],
  effect: { kind: "sequence", effects: [{ kind: "exile", target: 0 }, { kind: "draw", amount: 1 }] },
});
