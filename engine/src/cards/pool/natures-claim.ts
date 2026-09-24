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
      { kind: "destroy", target: 0 },
      // The printed order: "its controller" is who controlled it as it was
      // destroyed (rule 608.2h), a thief included.
      { kind: "gain-life", amount: 4, toControllerOfTarget: 0 },
    ],
  },
});
