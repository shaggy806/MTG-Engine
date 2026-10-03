import { defineCard } from "../define.js";

export default defineCard({
  name: "Rise of the Eldrazi",
  manaCost: "{9}{C}{C}{C}",
  colors: [],
  types: ["sorcery"],
  text:
    "This spell can't be countered.\n" +
    "Destroy target permanent. Target player draws four cards. Take an extra turn after this one.\n" +
    "Exile Rise of the Eldrazi.",
  cantBeCountered: true,
  exileOnResolve: true,
  targets: ["permanent", "player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "draw", amount: 4, target: 1 },
      { kind: "take-extra-turn" },
    ],
  },
});
