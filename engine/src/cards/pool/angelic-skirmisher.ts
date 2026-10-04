import { defineCard } from "../define.js";

// EDHREC rank 4692.
//
// Rulings:
//   [2013-01-24] Only creatures you control when the ability resolves will gain the chosen
//     ability. Creatures that come under your control later in the turn will not gain the ability.
//   [2013-01-24] You choose which ability creatures you control will gain when Angelic
//     Skirmisher’s ability resolves. This happens before attacking creatures are declared.

// The keyword is chosen as the ability resolves (the ruling) — an
// unannounced `modal` — and only creatures you control then gain it.
const YOURS = { type: "creature", controlledBy: "you" } as const;
const TEXT =
  "At the beginning of each combat, choose first strike, vigilance, or lifelink. Creatures you control gain that ability until end of turn.";

export default defineCard({
  name: "Angelic Skirmisher",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "any" },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "First strike",
            effect: { kind: "grant-keyword-all", filter: YOURS, keyword: "first-strike", duration: "end-of-turn" },
          },
          {
            text: "Vigilance",
            effect: { kind: "grant-keyword-all", filter: YOURS, keyword: "vigilance", duration: "end-of-turn" },
          },
          {
            text: "Lifelink",
            effect: { kind: "grant-keyword-all", filter: YOURS, keyword: "lifelink", duration: "end-of-turn" },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
