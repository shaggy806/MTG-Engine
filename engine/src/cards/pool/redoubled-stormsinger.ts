import { defineCard } from "../define.js";

// Which tokens is fixed as the ability resolves; each copy copies the
// original characteristics of its token as the effect that made it stated
// them (rule 707.2 — the rulings), enters tapped and attacking whichever
// player, planeswalker or battle you choose for it (rule 508.4), and so was
// never declared an attacker. Each is sacrificed, not exiled, at the next
// end step.
const ATTACK_TEXT =
  "Whenever this creature attacks, for each creature token you control that entered this turn, create a tapped and attacking token that's a copy of that token. At the beginning of the next end step, sacrifice those tokens.";

export default defineCard({
  name: "Redoubled Stormsinger",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Orc", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["first-strike"],
  text: `First strike\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "create-token-copy",
        of: { each: { type: "creature", token: true, controlledBy: "you", enteredThisTurn: true } },
        count: 1,
        who: "you",
        tapped: true,
        attacking: "choose",
        sacrificeAtEndStep: true,
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
