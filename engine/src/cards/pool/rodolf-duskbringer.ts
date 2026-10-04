import { defineCard } from "../define.js";

// EDHREC rank 6033.
//
// Rulings:
//   [2022-12-02] X is the total amount of life you gained this turn, regardless of any life lost.
//     For example, if you gained 3 life this turn and also lost 2 life this turn, X is 3, not 1.

export default defineCard({
  name: "Rodolf Duskbringer",
  manaCost: "{5}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "deathtouch", "lifelink"],
  text: "Flying, deathtouch, lifelink\nWhenever you gain life, Rodolf Duskbringer gains indestructible until end of turn.\nAt the beginning of your end step, you may pay {1}{W/B}. When you do, return target creature card with mana value X or less from your graveyard to the battlefield, where X is the amount of life you gained this turn.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "source",
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Whenever you gain life, Rodolf Duskbringer gains indestructible until end of turn.",
    },
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1}{W/B} to return a creature card from your graveyard to the battlefield?",
        cost: "{1}{W/B}",
        effect: {
          // X is read as the reflexive ability is put on the stack and its
          // target chosen (Celestine, the Living Saint's filter).
          kind: "reflexive-trigger",
          targets: [
            {
              kind: "card-in-graveyard",
              whose: "you",
              filter: {
                type: "creature",
                manaValue: { op: "lte", n: { amount: { turnStat: "life-gained", who: "you" } } },
              },
            },
          ],
          effect: { kind: "put-onto-battlefield", target: 0 },
          text: "When you do, return target creature card with mana value X or less from your graveyard to the battlefield, where X is the amount of life you gained this turn.",
        },
      },
      resolve: null,
      text: "At the beginning of your end step, you may pay {1}{W/B}. When you do, return target creature card with mana value X or less from your graveyard to the battlefield, where X is the amount of life you gained this turn.",
    },
  ],
});
