import { defineCard } from "../define.js";

// #201 in top-commanders.txt.
//
// The spell keeps its deathtouch and lifelink while it's on the stack, which
// is what the damage it deals reads.
const TRIGGER_TEXT =
  "Whenever you cast an instant or sorcery spell, choose one —\n" +
  "• That spell gains deathtouch and lifelink.\n" +
  '• Create a 2/2 red Imp creature token with "When this token dies, it deals 2 damage to each opponent."';

export default defineCard({
  name: "Judith, Carnage Connoisseur",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 3,
  toughness: 4,
  text: TRIGGER_TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "That spell gains deathtouch and lifelink.",
            effect: {
              kind: "sequence",
              effects: [
                { kind: "grant-keyword", target: "trigger-object", keyword: "deathtouch", duration: "end-of-turn" },
                { kind: "grant-keyword", target: "trigger-object", keyword: "lifelink", duration: "end-of-turn" },
              ],
            },
          },
          {
            text: 'Create a 2/2 red Imp creature token with "When this token dies, it deals 2 damage to each opponent."',
            effect: { kind: "create-token", token: "Imp Token (Judith)", count: 1 },
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
