import { defineCard } from "../define.js";

// EDHREC rank 6479.
//
// Rulings:
//   [2020-11-10] Court of Bounty's ability isn't the same as playing a land. You may still play a
//     land for the turn if you put a land onto the battlefield with it.
//
// "If you're the monarch" is read as the ability resolves, choosing which
// cards may be put in.
const ENTER_TEXT = "When this enchantment enters, you become the monarch.";
const UPKEEP_TEXT =
  "At the beginning of your upkeep, you may put a land card from your hand onto the battlefield. If you're the monarch, instead you may put a creature or land card from your hand onto the battlefield.";

const putFromHand = (filter: { type: "land" } | { typesAnyOf: ["creature", "land"] }) => ({
  kind: "look-and-choose" as const,
  zone: "hand" as const,
  min: 0,
  max: 1,
  destination: "battlefield" as const,
  leftover: "stay" as const,
  filter,
});

export default defineCard({
  name: "Court of Bounty",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
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
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "monarch", who: "you" },
        then: putFromHand({ typesAnyOf: ["creature", "land"] }),
        else: putFromHand({ type: "land" }),
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
