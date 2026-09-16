import { defineCard } from "../define.js";

export default defineCard({
  name: "Feed the Swarm",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target creature or enchantment an opponent controls. You lose life equal to that permanent's mana value.",
  targets: ["creature-or-enchantment-an-opponent-controls"],
  // The life loss reads the permanent *after* it has been destroyed, so
  // `manaValueOf` deliberately works off last known information (608.2h).
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "lose-life", amount: { manaValueOf: 0 } },
    ],
  },
});
