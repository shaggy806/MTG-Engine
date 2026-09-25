import { defineCard } from "../define.js";

export default defineCard({
  name: "Savor",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets -2/-2 until end of turn. Create a Food token. (It's an artifact with \"{2}, {T}, Sacrifice this token: You gain 3 life.\")",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      { kind: "create-token", token: "Food Token", count: 1 },
    ],
  },
});
