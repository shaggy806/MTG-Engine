import { defineCard } from "../define.js";

export default defineCard({
  name: "The Emperor of Palamecia",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Wizard"],
  power: 2,
  toughness: 2,
  text:
    "{T}: Add {U} or {R}. Spend this mana only to cast a noncreature spell.\n" +
    "Whenever you cast a noncreature spell, if at least four mana was spent to cast it, put a " +
    "+1/+1 counter on The Emperor of Palamecia. Then if it has three or more +1/+1 counters on " +
    "it, transform it.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["U", "R"] },
        amount: 1,
        spendOnly: {
          spell: { notTypes: ["creature"] },
          text: "Spend this mana only to cast a noncreature spell.",
        },
      },
      resolve: null,
      text: "{T}: Add {U} or {R}. Spend this mana only to cast a noncreature spell.",
    },
  ],
  triggered: [
    {
      // "If at least four mana was spent to cast it" is fixed once the spell
      // is cast, so checking it as the trigger fires is the same as checking
      // it again on resolution.
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { notTypes: ["creature"], manaSpent: { op: "gte", n: 4 } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          {
            kind: "conditional",
            condition: {
              kind: "self-counters",
              counter: "+1/+1",
              compare: { op: "gte", n: 3 },
            },
            then: { kind: "transform", target: "source" },
          },
        ],
      },
      resolve: null,
      text:
        "Whenever you cast a noncreature spell, if at least four mana was spent to cast it, put a " +
        "+1/+1 counter on The Emperor of Palamecia. Then if it has three or more +1/+1 counters on " +
        "it, transform it.",
    },
  ],
  faces: ["The Emperor of Palamecia", "The Lord Master of Hell"],
  transform: true,
});
