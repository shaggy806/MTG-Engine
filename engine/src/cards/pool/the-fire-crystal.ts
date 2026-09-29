import { defineCard } from "../define.js";

const REDUCE_TEXT = "Red spells you cast cost {1} less to cast.";
const HASTE_TEXT = "Creatures you control have haste.";
const COPY_TEXT =
  "{4}{R}{R}, {T}: Create a token that's a copy of target creature you control. Sacrifice it at the beginning of the next end step.";

export default defineCard({
  name: "The Fire Crystal",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${REDUCE_TEXT}\n${HASTE_TEXT}\n${COPY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { colors: ["R"] }, caster: "you", reduceGeneric: 1 },
      text: REDUCE_TEXT,
    },
    { affects: { scope: "creatures-you-control" }, grantKeywords: ["haste"], text: HASTE_TEXT },
  ],
  activated: [
    {
      cost: { mana: "{4}{R}{R}", tap: true },
      targets: ["creature-you-control"],
      effect: { kind: "create-token-copy", of: 0, count: 1, sacrificeAtEndStep: true },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
