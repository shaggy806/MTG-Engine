import { defineCard } from "../define.js";

// The first card to need the structured `{ kind: "permanent", filter }` target
// spec: "creature with flying" and "creature without flying" are exactly the
// kind of one-off shape the string literals stopped covering.
export default defineCard({
  name: "Clan Defiance",
  manaCost: "{X}{R}{G}",
  colors: ["R", "G"],
  types: ["sorcery"],
  text:
    "Choose one or more —\n" +
    "• Clan Defiance deals X damage to target creature with flying.\n" +
    "• Clan Defiance deals X damage to target creature without flying.\n" +
    "• Clan Defiance deals X damage to target player or planeswalker.",
  castModal: {
    minModes: 1,
    maxModes: 3,
    modes: [
      {
        text: "Clan Defiance deals X damage to target creature with flying.",
        targets: [{ kind: "permanent", filter: { type: "creature", keyword: "flying" } }],
        effect: { kind: "damage", amount: "x", target: 0 },
      },
      {
        text: "Clan Defiance deals X damage to target creature without flying.",
        targets: [
          { kind: "permanent", filter: { type: "creature", notKeyword: "flying" } },
        ],
        effect: { kind: "damage", amount: "x", target: 0 },
      },
      {
        text: "Clan Defiance deals X damage to target player or planeswalker.",
        targets: ["player-or-planeswalker"],
        effect: { kind: "damage", amount: "x", target: 0 },
      },
    ],
  },
});
