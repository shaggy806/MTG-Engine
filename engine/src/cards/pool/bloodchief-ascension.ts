import { defineCard } from "../define.js";

const QUEST_TEXT =
  "At the beginning of each end step, if an opponent lost 2 or more life this turn, you may put a quest counter on this enchantment. (Damage causes loss of life.)";
const DRAIN_TEXT =
  "Whenever a card is put into an opponent's graveyard from anywhere, if this enchantment has three or more quest counters on it, you may have that player lose 2 life. If you do, you gain 2 life.";

// "An opponent" is one opponent on their own, over the whole turn — two
// losing 1 each isn't enough (the ruling); the `turn-stat` condition reads
// each opponent's total separately. "That player" is the graveyard's owner,
// the card's controller now it's there — not whoever controlled it on the
// battlefield. Tokens aren't cards, so a dying token doesn't count.
export default defineCard({
  name: "Bloodchief Ascension",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${QUEST_TEXT}\n${DRAIN_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: { kind: "turn-stat", stat: "life-lost", who: "opponent", atLeast: 2 },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a quest counter on Bloodchief Ascension?",
        effect: { kind: "add-counter", target: "source", counter: "quest", amount: 1 },
      },
      resolve: null,
      text: QUEST_TEXT,
    },
    {
      trigger: { on: "put-into-graveyard", who: "opponent" },
      condition: { kind: "self-counters", counter: "quest", compare: { op: "gte", n: 3 } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Have that player lose 2 life? If you do, you gain 2 life.",
        effect: { kind: "lose-life", amount: 2, who: "trigger-controller" },
        then: { kind: "gain-life", amount: 2 },
      },
      resolve: null,
      text: DRAIN_TEXT,
    },
  ],
});
