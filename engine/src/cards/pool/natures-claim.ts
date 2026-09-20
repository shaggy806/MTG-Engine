import { defineCard } from "../define.js";

export default defineCard({
  name: "Nature's Claim",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Destroy target artifact or enchantment. Its controller gains 4 life.",
  targets: ["artifact-or-enchantment"],
  effect: {
    kind: "sequence",
    effects: [
      // Life first, while the target is still there to read a controller off
      // — the same ordering Swords to Plowshares uses.
      { kind: "gain-life", amount: 4, toControllerOfTarget: 0 },
      { kind: "destroy", target: 0 },
    ],
  },
});
