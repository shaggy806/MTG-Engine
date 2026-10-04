import { defineCard } from "../define.js";

// EDHREC rank 3765.
//
// Rulings:
//   [2023-09-01] The game starts with no monarch. As a player becomes the monarch, the current
//     monarch (if any) ceases being the monarch. There is never more than one monarch at a time.
//
// A permanent card is one that isn't an instant or sorcery (Angel of
// Indemnity's filter). Whether you're the monarch is read as it resolves
// (Court of Grace's shape).
const ENTER_TEXT = "When this enchantment enters, you become the monarch.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, return target permanent card with mana value 3 or less from your graveyard to your hand. If you're the monarch, return that permanent card to the battlefield instead.";

export default defineCard({
  name: "Court of Ardenvale",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${UPKEEP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { notTypes: ["instant", "sorcery"], manaValue: { op: "lte", n: 3 } },
        },
      ],
      effect: {
        kind: "conditional",
        condition: { kind: "monarch", who: "you" },
        then: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
        else: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
