import { defineCard } from "../define.js";

const KEEP_TEXT = "You don't lose unspent red mana as steps and phases end.";
const DIES_TEXT =
  "When this creature dies, you may pay any amount of {R}. When you do, it deals that much damage to any target.";

// The red mana stays while the Tyrant is on the battlefield, into later turns
// too; once it's gone, the mana goes as the current step or phase ends (the
// rulings). The dies trigger has no target: as it resolves, any amount of
// {R} is paid — the mana kept included — and a second, reflexive ability
// triggers, targeting then, which players can respond to (the ruling).
export default defineCard({
  name: "Leyline Tyrant",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${KEEP_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      keepsUnspentMana: ["R"],
      text: KEEP_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay any amount of {R} to have it deal that much damage to any target?",
        cost: "{X}",
        xColor: "R",
        effect: {
          kind: "reflexive-trigger",
          targets: ["any-target"],
          effect: { kind: "damage", amount: "x", target: 0 },
          text: "When you do, it deals that much damage to any target.",
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
