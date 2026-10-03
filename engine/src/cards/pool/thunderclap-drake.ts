import { defineCard } from "../define.js";

const REDUCE_TEXT = "Instant and sorcery spells you cast cost {1} less to cast.";
const COPY_TEXT =
  "{2}{U}, Sacrifice this creature: When you next cast an instant or sorcery spell this turn, copy it for each " +
  "time you've cast your commander from the command zone this game. You may choose new targets for the copies.";
const NEXT_SPELL_TEXT =
  "When you next cast an instant or sorcery spell this turn, copy it for each time you've cast your commander " +
  "from the command zone this game. You may choose new targets for the copies.";

// The count is read as the delayed trigger resolves: every cast of each of
// your commanders from the command zone, a partner pair's added up (the
// ruling). The copies aren't cast, keep the spell's X, modes and division,
// and each may get new targets.
export default defineCard({
  name: "Thunderclap Drake",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${REDUCE_TEXT}\n${COPY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["instant", "sorcery"] }, caster: "you", reduceGeneric: 1 },
      text: REDUCE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{U}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: { nextSpell: { typesAnyOf: ["instant", "sorcery"] } },
        effect: {
          kind: "copy-spell",
          target: "trigger-spell",
          newTargets: true,
          count: { commanderCasts: "you" },
        },
        text: NEXT_SPELL_TEXT,
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
