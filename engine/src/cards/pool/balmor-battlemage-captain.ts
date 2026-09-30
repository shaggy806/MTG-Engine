import { defineCard } from "../define.js";

const TEXT =
  "Whenever you cast an instant or sorcery spell, creatures you control get +1/+0 and gain trample until end of turn.";
const YOURS = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Balmor, Battlemage Captain",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "modify-pt-all", filter: YOURS, power: 1, toughness: 0, duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: YOURS, keyword: "trample", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
