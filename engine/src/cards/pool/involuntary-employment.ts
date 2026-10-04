import { defineCard } from "../define.js";

// EDHREC rank 6185.
// Act of Treason's shape, then a Treasure.

export default defineCard({
  name: "Involuntary Employment",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Gain control of target creature until end of turn. Untap that creature. It gains haste until end of turn. Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "gain-control", target: 0, untilEndOfTurn: true },
      { kind: "untap", target: 0 },
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
