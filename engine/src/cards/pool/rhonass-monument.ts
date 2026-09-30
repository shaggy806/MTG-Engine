import { defineCard } from "../define.js";

const COST_TEXT = "Green creature spells you cast cost {1} less to cast.";
const CAST_TEXT = "Whenever you cast a creature spell, target creature you control gets +2/+2 and gains trample until end of turn.";

export default defineCard({
  name: "Rhonas's Monument",
  manaCost: "{3}",
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${COST_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "creature", colors: ["G"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt", target: 0, power: 2, toughness: 2, duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
