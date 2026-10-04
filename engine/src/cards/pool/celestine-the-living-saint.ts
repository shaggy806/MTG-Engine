import { defineCard } from "../define.js";

// EDHREC rank 2881.
//
// Rulings:
//   [2022-10-07] Celestine's triggered ability looks at the total amount of life you gained to
//     determine X, regardless of whether or not you also lost any life.
//   [2022-10-07] The target creature card is chosen as the triggered ability is put on the stack.
//     Gaining life after that point won't let you choose a target with a higher mana value.

const TRIGGER_TEXT =
  "Healing Tears — At the beginning of your end step, return target creature card with mana value X or less from your graveyard to the battlefield, where X is the amount of life you gained this turn.";

export default defineCard({
  name: "Celestine, the Living Saint",
  manaCost: "{4}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 4,
  keywords: ["flying", "lifelink"],
  text: `Flying, lifelink\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
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
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
