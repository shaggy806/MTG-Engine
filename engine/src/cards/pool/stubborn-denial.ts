import { defineCard } from "../define.js";

// Ferocious is checked as it resolves, and "instead" means only the upgraded
// effect happens (its ruling): a hard counter, with no chance to pay.
export default defineCard({
  name: "Stubborn Denial",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Counter target noncreature spell unless its controller pays {1}.\n" +
    "Ferocious — If you control a creature with power 4 or greater, counter that spell instead.",
  targets: ["noncreature-spell"],
  effect: {
    kind: "conditional",
    condition: {
      kind: "controls",
      filter: { type: "creature", power: { op: "gte", n: 4 } },
      atLeast: 1,
    },
    then: { kind: "counter", target: 0 },
    else: {
      kind: "unless",
      chooser: 0,
      options: [{ pay: "{1}", text: "Pay {1}" }],
      otherwise: { kind: "counter", target: 0 },
    },
  },
});
