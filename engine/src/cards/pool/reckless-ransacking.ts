import { defineCard } from "../define.js";

export default defineCard({
  name: "Reckless Ransacking",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gets +3/+2 until end of turn. Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 2, duration: "end-of-turn" },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
