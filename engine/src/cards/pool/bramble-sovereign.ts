import { defineCard } from "../define.js";

// EDHREC rank 4720.
//
// Rulings:
//   [2018-06-08] If the entering creature leaves the battlefield before Bramble Sovereign's
//     ability resolves, use that creature's last known existence on the battlefield to determine
//     the token's characteristics.
//   [2018-06-08] While resolving the triggered ability of Bramble Sovereign, you can't pay {1}{G}
//     multiple times to have a player create more tokens.
// The copy enters under the copied creature's controller (its last-known one
// if it has left) — `create-token-copy`'s default.

const COPY_TEXT =
  "Whenever another nontoken creature enters, you may pay {1}{G}. If you do, that creature's controller creates a token that's a copy of that creature.";

export default defineCard({
  name: "Bramble Sovereign",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dryad"],
  power: 4,
  toughness: 4,
  text: COPY_TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "any",
        filter: { token: false, type: "creature" },
        otherOnly: true,
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1}{G} to have that creature's controller create a token copy of it?",
        cost: "{1}{G}",
        effect: { kind: "create-token-copy", of: "trigger-object", count: 1 },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
