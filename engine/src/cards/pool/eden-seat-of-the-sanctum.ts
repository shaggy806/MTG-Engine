import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 3679.
//
// Rulings:
//   [2025-06-06] You don't choose a target for Eden, Seat of the Sanctum's last ability at the
//     time you activate it. Rather, a second "reflexive" ability triggers when you sacrifice Eden,
//     Seat of the Sanctum this way. You choose a target for that ability as it goes on the stack.
//
// "When you do" is a reflexive trigger (rule 603.12) that only a sacrifice
// that happened fires (Obscura Storefront's `sacrifice-source` → `then`).
// "Another" is any card but Eden itself, which is in the graveyard by then.
const MILL_TEXT =
  "{5}, {T}: Mill two cards. Then you may sacrifice this land. When you do, return another target permanent card from your graveyard to your hand.";
const RETURN_TEXT = "Return another target permanent card from your graveyard to your hand.";

export default defineCard({
  name: "Eden, Seat of the Sanctum",
  colors: [],
  types: ["land"],
  subtypes: ["Town"],
  text: `{T}: Add {C}.\n${MILL_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{5}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 2 },
          {
            kind: "may",
            prompt: "Sacrifice Eden to return another permanent card from your graveyard to your hand?",
            effect: {
              kind: "sacrifice-source",
              then: {
                kind: "reflexive-trigger",
                targets: [
                  {
                    kind: "other",
                    of: {
                      kind: "card-in-graveyard",
                      whose: "you",
                      filter: { typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"] },
                    },
                  },
                ],
                effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
                text: RETURN_TEXT,
              },
            },
          },
        ],
      },
      resolve: null,
      text: MILL_TEXT,
    },
  ],
});
