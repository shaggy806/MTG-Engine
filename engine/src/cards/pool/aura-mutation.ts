import { defineCard } from "../define.js";

export default defineCard({
  name: "Aura Mutation",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  types: ["instant"],
  text: "Destroy target enchantment. Create X 1/1 green Saproling creature tokens, where X is that enchantment's mana value.",
  targets: ["enchantment"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Saproling Token", count: { manaValueOf: 0 } },
    ],
  },
});
