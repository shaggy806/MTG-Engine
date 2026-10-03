import { defineCard } from "../define.js";

// Once for each player attacked (the ruling), and the target must be
// attacking that player — not a planeswalker they control. "Except it's
// 1/1" is a copy exception (rule 707.9b), so the token is a 1/1 version of
// whatever the creature copies, if anything (the ruling). It enters tapped
// and attacking that player without ever having attacked, so nothing that
// triggers on attacking sees it (rule 508.4 — the ruling).
const MENACE_TEXT = "Creature tokens you control have menace.";
const ATTACK_TEXT =
  "Whenever you attack a player, choose target nontoken creature that's attacking that player. Create a token that's a copy of that creature, except it's 1/1. The token enters tapped and attacking that player. Sacrifice it at the beginning of the next end step.";

export default defineCard({
  name: "Echoing Assault",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${MENACE_TEXT}\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", token: true, controlledBy: "you" } },
      grantKeywords: ["menace"],
      text: MENACE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks-player", who: "you", defender: "opponent" },
      targets: [{ kind: "permanent", attacking: "trigger-player", filter: { type: "creature", token: false } }],
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        who: "you",
        basePt: [1, 1],
        tapped: true,
        attacking: { player: "trigger-player" },
        sacrificeAtEndStep: true,
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
