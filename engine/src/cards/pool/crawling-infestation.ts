import { defineCard } from "../define.js";

// EDHREC rank 4607.
//
// Rulings:
//   [2021-11-19] Crawling Infestation must be on the battlefield for its ability to trigger. If
//     it's destroyed at the same time as one or more creatures you own, its ability won't trigger.

export default defineCard({
  name: "Crawling Infestation",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, you may mill two cards. (You may put the top two cards of your library into your graveyard.)\nWhenever one or more creature cards are put into your graveyard from anywhere during your turn, create a 1/1 green Insect creature token. This ability triggers only once each turn.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Mill two cards?",
        effect: { kind: "mill", target: "you", amount: 2 },
      },
      resolve: null,
      text: "At the beginning of your upkeep, you may mill two cards.",
    },
    {
      // Crawling Sensation's batched trigger. "During your turn" is part of
      // the trigger condition (rule 603.1), so it's a `whileCondition`: a
      // batch on an opponent's turn doesn't trigger it, or use up its once.
      trigger: { on: "put-into-graveyard", who: "you", filter: { type: "creature" }, batched: true },
      whileCondition: { kind: "your-turn" },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Insect Token", count: 1 },
      resolve: null,
      text: "Whenever one or more creature cards are put into your graveyard from anywhere during your turn, create a 1/1 green Insect creature token. This ability triggers only once each turn.",
    },
  ],
});
