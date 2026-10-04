import { defineCard } from "../define.js";

const STATIC_TEXT = "Creatures with flying can't attack you or planeswalkers you control.";
const TOKEN_TEXT = "At the beginning of your end step, create a 5/5 green Wurm creature token.";

// The flying check reads each creature's current keywords (a `filter` scope's
// `keyword` clause goes through the layer fold), so a creature granted flying
// can't attack you and one that lost it can. It's checked as attackers are
// declared: a creature already attacking you that gains flying stays in
// combat (the 2017-04-18 ruling).
export default defineCard({
  name: "Sandwurm Convergence",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${STATIC_TEXT}\n${TOKEN_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", keyword: "flying" } },
      cantAttackController: true,
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Wurm Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
