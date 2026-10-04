import { defineCard } from "../define.js";

const PRAY_TEXT = "Pray for Protection — Creatures you control gain indestructible until end of turn.";
const DEAL_TEXT = "Strike a Deal — You and target opponent each draw two cards.";

export default defineCard({
  name: "Your Temple Is Under Attack",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: `Choose one —\n• ${PRAY_TEXT}\n• ${DEAL_TEXT}`,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: PRAY_TEXT,
        effect: {
          kind: "grant-keyword-all",
          filter: { type: "creature", controlledBy: "you" },
          keyword: "indestructible",
          duration: "end-of-turn",
        },
      },
      {
        text: DEAL_TEXT,
        targets: ["opponent"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "draw", amount: 2 },
            { kind: "draw", amount: 2, target: 0 },
          ],
        },
      },
    ],
  },
});
