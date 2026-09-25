import { defineCard } from "../define.js";

// #457 in top-commanders.txt.
const EVASION_TEXT = "Creatures you control with power 2 or less can't be blocked by creatures with power 3 or greater.";
const DOUBLE_TEXT =
  "If a triggered ability of a creature you control with power 2 or less triggers, that ability " +
  "triggers an additional time.";
const small = { type: "creature", controlledBy: "you", power: { op: "lte", n: 2 } } as const;

export default defineCard({
  name: "Delney, Streetwise Lookout",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 2,
  toughness: 2,
  text: `${EVASION_TEXT}\n${DOUBLE_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: small },
      cantBeBlockedBy: { power: { op: "gte", n: 3 } },
      text: EVASION_TEXT,
    },
    { affects: { scope: "self" }, doubleTriggersOf: { filter: small }, text: DOUBLE_TEXT },
  ],
});
