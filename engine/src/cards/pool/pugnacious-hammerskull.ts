import { defineCard } from "../define.js";

// "While you don't control another Dinosaur" is part of the trigger
// condition (rule 603.1), checked only as it attacks — a Dinosaur arriving
// before the ability resolves doesn't stop the counter. A stun counter
// (rule 122.1d): the next time it would untap, one is removed instead.
const TEXT =
  "Whenever this creature attacks while you don't control another Dinosaur, put a stun counter on it. (If a permanent with a stun counter would become untapped, remove one from it instead.)";

export default defineCard({
  name: "Pugnacious Hammerskull",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 6,
  toughness: 6,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      whileCondition: {
        kind: "not",
        of: { kind: "controls", filter: { subtype: "Dinosaur" }, atLeast: 1, excludeSelf: true },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "stun", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
