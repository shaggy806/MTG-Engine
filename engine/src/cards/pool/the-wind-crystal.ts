import { defineCard } from "../define.js";

const COST_TEXT = "White spells you cast cost {1} less to cast.";
const GAIN_TEXT = "If you would gain life, you gain twice that much life instead.";
const ACTIVATE_TEXT = "{4}{W}{W}, {T}: Creatures you control gain flying and lifelink until end of turn.";

const YOURS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "The Wind Crystal",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${COST_TEXT}\n${GAIN_TEXT}\n${ACTIVATE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { colors: ["W"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
    {
      affects: { scope: "self" },
      replacement: { event: "would-gain-life", who: "you", multiplier: 2 },
      text: GAIN_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{W}{W}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: YOURS, keyword: "flying", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: YOURS, keyword: "lifelink", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: ACTIVATE_TEXT,
    },
  ],
});
