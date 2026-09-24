import { defineCard } from "../define.js";

const BIG = { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } } as const;

// The attack trigger's set is fixed by the trample grant; the +1/+1 after it
// re-reads power, and nothing the grant did changes any creature's power.
export default defineCard({
  name: "Goreclaw, Terror of Qal Sisma",
  manaCost: "{3}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bear"],
  power: 4,
  toughness: 3,
  text:
    "Creature spells you cast with power 4 or greater cost {2} less to cast.\n" +
    "Whenever Goreclaw attacks, each creature you control with power 4 or greater gets +1/+1 and gains trample until end of turn.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", power: { op: "gte", n: 4 } },
        caster: "you",
        reduceGeneric: 2,
      },
      text: "Creature spells you cast with power 4 or greater cost {2} less to cast.",
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: BIG, keyword: "trample", duration: "end-of-turn" },
          { kind: "modify-pt-all", filter: BIG, power: 1, toughness: 1, duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text:
        "Whenever Goreclaw attacks, each creature you control with power 4 or greater gets +1/+1 and gains trample until end of turn.",
    },
  ],
});
