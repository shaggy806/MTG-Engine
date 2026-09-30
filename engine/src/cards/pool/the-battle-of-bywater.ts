import { defineCard } from "../define.js";

// The Food count is read after the destruction, so it counts only the
// creatures that survived it.
export default defineCard({
  name: "The Battle of Bywater",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "Destroy all creatures with power 3 or greater. Then create a Food token for each creature you control. " +
    '(It\'s an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")',
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature", power: { op: "gte", n: 3 } } },
      {
        kind: "create-token",
        token: "Food Token",
        count: { countOf: { type: "creature", controlledBy: "you" } },
      },
    ],
  },
});
