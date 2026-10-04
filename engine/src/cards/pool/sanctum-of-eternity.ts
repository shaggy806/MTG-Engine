import { defineCard } from "../define.js";

// EDHREC rank 3766.
//
// Rulings:
//   [2019-08-23] If your commander isn't on the battlefield (or if you're not playing the
//     Commander variant), Sanctum of Eternity's second ability does nothing.
const RETURN_TEXT =
  "{2}, {T}: Return target commander you own from the battlefield to your hand. Activate only during your turn.";

export default defineCard({
  name: "Sanctum of Eternity",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${RETURN_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      condition: { kind: "your-turn" },
      targets: [{ kind: "permanent", filter: { isCommander: true, ownedBy: "you" } }],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
