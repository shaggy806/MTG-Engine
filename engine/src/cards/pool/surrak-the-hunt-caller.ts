import { defineCard } from "../define.js";

const FORMIDABLE_TEXT =
  "Formidable — At the beginning of combat on your turn, if creatures you control have total power 8 or greater, " +
  "target creature you control gains haste until end of turn. (It can attack and {T} no matter when it came under your control.)";

// An intervening if (rule 603.4): checked as combat begins and again as the
// ability resolves, Surrak's own power counted (the rulings).
export default defineCard({
  name: "Surrak, the Hunt Caller",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 5,
  toughness: 4,
  text: FORMIDABLE_TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: {
        kind: "aggregate",
        value: { aggregate: "sum", of: "power", filter: { type: "creature", controlledBy: "you" } },
        compare: { op: "gte", n: 8 },
      },
      targets: ["creature-you-control"],
      effect: { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      resolve: null,
      text: FORMIDABLE_TEXT,
    },
  ],
});
