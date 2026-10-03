import { defineCard } from "../define.js";

const TEXT =
  "Return target creature with mana value X to its owner's hand. You create X 1/1 blue Faerie creature tokens with flying.";

// The target reads X, which is chosen first (rule 601.2b–c): the spell is
// offered once per X that has a creature of that mana value, and the target
// is checked again at that X as it resolves. An illegal target by then means
// no Faeries (the ruling: it doesn't resolve). A creature with {X} in its
// cost has mana value 0 on the battlefield (the other ruling — rule 202.3b).
export default defineCard({
  name: "Stolen by the Fae",
  manaCost: "{X}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: TEXT,
  targets: [{ kind: "permanent", filter: { type: "creature", manaValue: { op: "eq", n: "x" } } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0 },
      { kind: "create-token", token: "Faerie Token", count: "x" },
    ],
  },
});
