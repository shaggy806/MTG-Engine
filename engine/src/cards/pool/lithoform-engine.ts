import { defineCard } from "../define.js";

const ABILITY_TEXT =
  "{2}, {T}: Copy target activated or triggered ability you control. You may choose new targets for the copy.";
const SPELL_TEXT = "{3}, {T}: Copy target instant or sorcery spell you control. You may choose new targets for the copy.";
const PERMANENT_TEXT = "{4}, {T}: Copy target permanent spell you control. (The copy becomes a token.)";

// The rulings this follows: a copied ability has the original's source,
// modes, targets and X, and its choices made on resolution are made again —
// a "you may pay" cost the copy asks for again; a copy of a kicked spell is
// kicked; a copy of a permanent spell becomes a token as it resolves, and
// can't be given new targets (an Aura's). Copies aren't cast or activated,
// and resolve first.
export default defineCard({
  name: "Lithoform Engine",
  manaCost: "{4}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${ABILITY_TEXT}\n${SPELL_TEXT}\n${PERMANENT_TEXT}`,
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [{ kind: "ability", whose: "you" }],
      effect: { kind: "copy-ability", target: 0, newTargets: true },
      resolve: null,
      text: ABILITY_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [{ kind: "spell", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: { kind: "copy-spell", target: 0, newTargets: true },
      resolve: null,
      text: SPELL_TEXT,
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: [{ kind: "spell", whose: "you", filter: { notTypes: ["instant", "sorcery"] } }],
      effect: { kind: "copy-spell", target: 0 },
      resolve: null,
      text: PERMANENT_TEXT,
    },
  ],
});
