import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 5813.
// Makes Clue → use "Clue Token".
//
// Rulings:
//   [2025-10-02] Creating a Clue token this way isn't the same thing as investigating.

const CLUE_TEXT =
  "When this enchantment enters and at the beginning of your upkeep, you lose 1 life and create a Clue token.";
const ATTACK_TEXT =
  "Whenever you attack, put X +1/+1 counters on target attacking creature, where X is the number of " +
  "permanents you've sacrificed this turn. If X is three or more, that creature gains lifelink until end of turn.";

const LOSE_AND_CLUE: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "lose-life", amount: 1 },
    { kind: "create-token", token: "Clue Token", count: 1 },
  ],
};

export default defineCard({
  name: "Obsessive Pursuit",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${CLUE_TEXT} (It's an artifact with "{2}, Sacrifice this token: Draw a card.")\n${ATTACK_TEXT}`,
  triggered: [
    // "When this enters and at the beginning of your upkeep" is two triggers
    // with one effect.
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: LOSE_AND_CLUE,
      resolve: null,
      text: CLUE_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: LOSE_AND_CLUE,
      resolve: null,
      text: CLUE_TEXT,
    },
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }],
      // X is read as the ability resolves, both for the counters and for the
      // "three or more" check.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: { turnHistory: "sacrificed", who: "you" } },
          {
            kind: "conditional",
            condition: { kind: "turn-history", what: "sacrificed", who: "you", atLeast: 3 },
            then: { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
