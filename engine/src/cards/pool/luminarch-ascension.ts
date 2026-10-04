import { defineCard } from "../define.js";

// EDHREC rank 3315.
// Makes Angel → use "4/4 Angel Token".
//
// Rulings:
//   [2018-03-16] Luminarch Ascension's first ability doesn't trigger if you have lost life before
//     an opponent's end step begins. If it does trigger but you lose life before it resolves, it
//     does nothing and you won't put a quest counter on Luminarch Ascension.
//   [2018-03-16] Luminarch Ascension's first ability cares only whether you lost life this turn,
//     even if Luminarch Ascension wasn't on the battlefield when that happened. It doesn't care
//     how much you lost, whether you also gained life, or even whether you gained more life than
//     you lost.
//   [2018-03-16] You can activate Luminarch Ascension's last ability during the end step in which
//     it receives its fourth quest counter.

const QUEST_TEXT =
  "At the beginning of each opponent's end step, if you didn't lose life this turn, you may put a quest counter on this enchantment. (Damage causes loss of life.)";
const ANGEL_TEXT =
  "{1}{W}: Create a 4/4 white Angel creature token with flying. Activate only if this enchantment has four or more quest counters on it.";

export default defineCard({
  name: "Luminarch Ascension",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${QUEST_TEXT}\n${ANGEL_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      condition: { kind: "self-counters", counter: "quest", compare: { op: "gte", n: 4 } },
      targets: [],
      effect: { kind: "create-token", token: "4/4 Angel Token", count: 1 },
      resolve: null,
      text: ANGEL_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "opponent" },
      // Intervening-if (rule 603.4): checked as it triggers and again as it
      // resolves (the ruling: lose life in between and it does nothing).
      condition: { kind: "not", of: { kind: "turn-stat", stat: "life-lost", who: "you", atLeast: 1 } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a quest counter on Luminarch Ascension?",
        effect: { kind: "add-counter", target: "source", counter: "quest", amount: 1 },
      },
      resolve: null,
      text: QUEST_TEXT,
    },
  ],
});
