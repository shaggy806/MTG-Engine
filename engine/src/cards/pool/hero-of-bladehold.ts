import { defineCard } from "../define.js";

// Both abilities trigger as it attacks; with the token trigger resolving
// first, battle cry pumps the tokens too (2011-06-01 ruling), so their order
// is the player's (the opt-in `order-triggers` decision, rule 603.3b). The
// tokens attack whoever their controller chooses, and weren't declared as
// attackers (rule 508.4).
const BATTLE_CRY_TEXT =
  "Battle cry (Whenever this creature attacks, each other attacking creature gets +1/+0 until end of turn.)";
const TOKENS_TEXT =
  "Whenever this creature attacks, create two 1/1 white Soldier creature tokens that are tapped and attacking.";

export default defineCard({
  name: "Hero of Bladehold",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 4,
  text: `${BATTLE_CRY_TEXT}\n${TOKENS_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", attacking: true },
        power: 1,
        toughness: 0,
        duration: "end-of-turn",
        exceptSource: true,
      },
      resolve: null,
      text: BATTLE_CRY_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 2, tapped: true, attacking: "choose" },
      resolve: null,
      text: TOKENS_TEXT,
    },
  ],
});
