import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghalta, Primal Hunger",
  manaCost: "{10}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dinosaur"],
  power: 12,
  toughness: 12,
  keywords: ["trample"],
  text:
    "This spell costs {X} less to cast, where X is the total power of creatures you control.\n" +
    "Trample",
  selfCostReduction: {
    // Unconditional: the same always-true gate Blasphemous Act uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    // Only the generic part comes off: {G}{G} is always paid (rule 601.2f).
    reduceGeneric: {
      aggregate: "sum",
      of: "power",
      filter: { type: "creature", controlledBy: "you" },
    },
  },
});
