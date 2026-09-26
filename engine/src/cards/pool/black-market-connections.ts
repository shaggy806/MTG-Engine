import { defineCard } from "../define.js";

// "Choose one or more" is announced as the ability goes on the stack (rule
// 700.2b); the life loss belongs to each mode chosen.
const SELL = "Sell Contraband — Create a Treasure token. You lose 1 life.";
const BUY = "Buy Information — Draw a card. You lose 2 life.";
const HIRE =
  "Hire a Mercenary — Create a 3/2 colorless Shapeshifter creature token with changeling. You lose 3 life. " +
  "(It is every creature type.)";
const TRIGGER_TEXT = "At the beginning of your first main phase, choose one or more —";

export default defineCard({
  name: "Black Market Connections",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: `${TRIGGER_TEXT}\n• ${SELL}\n• ${BUY}\n• ${HIRE}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "modal",
        announced: true,
        minModes: 1,
        maxModes: 3,
        modes: [
          {
            text: SELL,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "create-token", token: "Treasure Token", count: 1 },
                { kind: "lose-life", amount: 1 },
              ],
            },
          },
          {
            text: BUY,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "draw", amount: 1 },
                { kind: "lose-life", amount: 2 },
              ],
            },
          },
          {
            text: HIRE,
            effect: {
              kind: "sequence",
              effects: [
                { kind: "create-token", token: "3/2 Shapeshifter Token", count: 1 },
                { kind: "lose-life", amount: 3 },
              ],
            },
          },
        ],
      },
      resolve: null,
      text: `${TRIGGER_TEXT} ${SELL} ${BUY} ${HIRE}`,
    },
  ],
});
