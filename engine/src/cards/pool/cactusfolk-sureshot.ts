import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 5861.
//
// Rulings:
//   [2024-04-12] Cactusfolk Sureshot's last ability affects only creatures you control at the time
//     it resolves. Creatures you control with power 4 or greater you begin to control later in the
//     turn won't gain trample or haste.
// `grant-keyword-all` hits what matches as it resolves (rule 611.2c), which is
// that ruling.

const COMBAT_TEXT =
  "At the beginning of combat on your turn, other creatures you control with power 4 or greater gain trample and haste until end of turn.";
const BIG = { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } } as const;

export default defineCard({
  name: "Cactusfolk Sureshot",
  manaCost: "{2}{R}{G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Plant", "Mercenary"],
  power: 4,
  toughness: 4,
  keywords: ["reach"],
  text: `Reach\nWard {2} (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays {2}.)\n${COMBAT_TEXT}`,
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: BIG, keyword: "trample", duration: "end-of-turn", exceptSource: true },
          { kind: "grant-keyword-all", filter: BIG, keyword: "haste", duration: "end-of-turn", exceptSource: true },
        ],
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
