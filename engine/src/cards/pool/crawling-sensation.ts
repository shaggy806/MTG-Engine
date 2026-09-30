import { defineCard } from "../define.js";

const MILL_TEXT = "At the beginning of your upkeep, you may mill two cards. (You may put the top two cards of your library into your graveyard.)";
const INSECT_TEXT =
  "Whenever one or more land cards are put into your graveyard from anywhere for the first time each turn, create a 1/1 green Insect creature token.";

export default defineCard({
  name: "Crawling Sensation",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${MILL_TEXT}\n${INSECT_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "may", prompt: "Mill two cards?", effect: { kind: "mill", target: "you", amount: 2 } },
      resolve: null,
      text: MILL_TEXT,
    },
    {
      trigger: { on: "put-into-graveyard", who: "you", filter: { type: "land" }, batched: true },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Insect Token", count: 1 },
      resolve: null,
      text: INSECT_TEXT,
    },
  ],
});
