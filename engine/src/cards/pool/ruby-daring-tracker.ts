import { defineCard } from "../define.js";

const ATTACK_TEXT = "Whenever Ruby attacks while you control a creature with power 4 or greater, Ruby gets +2/+2 until end of turn.";

// "While you control" is part of the trigger condition (rule 603.1), checked
// only as it attacks — not an intervening "if" (603.4): the ruling has Ruby
// still get +2/+2 if the power-4 creature is gone by the time it resolves.
export default defineCard({
  name: "Ruby, Daring Tracker",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scout"],
  power: 1,
  toughness: 2,
  keywords: ["haste"],
  text: `Haste\n${ATTACK_TEXT}\n{T}: Add {R} or {G}.`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      whileCondition: { kind: "controls", filter: { type: "creature", power: { op: "gte", n: 4 } }, atLeast: 1 },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
    },
  ],
});
