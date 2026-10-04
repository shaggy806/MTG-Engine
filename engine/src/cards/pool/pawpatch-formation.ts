import { defineCard } from "../define.js";

// EDHREC rank 4444.
// Makes Food → "Food Token".
//
// Rulings:
//   [2024-11-08] You can't sacrifice a Food to pay multiple costs. For example, you can't
//     sacrifice a Food token to activate its own ability and also to activate Maraleaf Rider's
//     ability.
//   [2024-11-08] Food is an artifact type. Even though it appears on some creatures, it's never a
//     creature type.

export default defineCard({
  name: "Pawpatch Formation",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Choose one —\n• Destroy target creature with flying.\n• Destroy target enchantment.\n• Draw a card. Create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target creature with flying.",
        targets: [{ kind: "permanent", filter: { type: "creature", keyword: "flying" } }],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Destroy target enchantment.",
        targets: ["enchantment"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Draw a card. Create a Food token.",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: 1 },
            { kind: "create-token", token: "Food Token", count: 1 },
          ],
        },
      },
    ],
  },
});
