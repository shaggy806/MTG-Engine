import { defineCard } from "../define.js";

export default defineCard({
  name: "Temur Battle Rage",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Target creature gains double strike until end of turn.\n" +
    "Ferocious — That creature also gains trample until end of turn if you control a creature with power 4 or greater.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      {
        kind: "conditional",
        condition: { kind: "controls", filter: { type: "creature", power: { op: "gte", n: 4 } }, atLeast: 1 },
        then: { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      },
    ],
  },
});
