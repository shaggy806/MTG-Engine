import { defineCard } from "../define.js";

// A spell's mana value on the stack counts its chosen {X} (rule 202.3e).
export default defineCard({
  name: "Mental Misstep",
  manaCost: "{U/P}",
  colors: ["U"],
  types: ["instant"],
  text:
    "({U/P} can be paid with either {U} or 2 life.)\n" +
    "Counter target spell with mana value 1.",
  targets: [{ kind: "spell", filter: { manaValue: { op: "eq", n: 1 } } }],
  effect: { kind: "counter", target: 0 },
});
