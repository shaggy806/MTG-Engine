import { defineCard } from "../define.js";

const RESTRICT_TEXT = "Rhonas can't attack or block unless you control another creature with power 4 or greater.";
const PUMP_TEXT = "{2}{G}: Another target creature gets +2/+0 and gains trample until end of turn.";

// A static's `controls` condition leaves Rhonas itself out, which is the
// "another". Checked only as attackers and blockers are declared: once in
// combat it stays there (the rulings).
export default defineCard({
  name: "Rhonas the Indomitable",
  manaCost: "{2}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 5,
  toughness: 5,
  keywords: ["deathtouch", "indestructible"],
  text: `Deathtouch, indestructible\n${RESTRICT_TEXT}\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: {
        kind: "not",
        of: {
          kind: "controls",
          filter: { type: "creature", power: { op: "gte", n: 4 } },
          atLeast: 1,
        },
      },
      restrictions: ["cant-attack", "cant-block"],
      text: RESTRICT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
      targets: [{ kind: "other", of: "creature" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
