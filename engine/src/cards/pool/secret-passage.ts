import { defineCard } from "../define.js";

export default defineCard({
  name: "Secret Passage",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\n{T}: Add {U} or {B}.\n{4}, {T}: Investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["U", "B"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {U} or {B}.",
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "{4}, {T}: Investigate.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
