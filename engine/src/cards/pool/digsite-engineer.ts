import { defineCard } from "../define.js";

// EDHREC rank 4934.
//
// Rulings:
//   [2021-04-16] The token gets created before the artifact spell that triggered its creation
//     resolves. Fortunately, the token counts itself, so it's at least 1/1.
//
// The token is Urza, Chief Artificer's Construct (0/0, +1/+1 per artifact you
// control); the optional payment is Dawn of Hope's `may` with a `cost`.
const TEXT =
  'Whenever you cast an artifact spell, you may pay {2}. If you do, create a 0/0 colorless Construct artifact creature token with "This token gets +1/+1 for each artifact you control."';

export default defineCard({
  name: "Digsite Engineer",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dwarf", "Artificer"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "artifact" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {2} to create a Construct token?",
        cost: "{2}",
        effect: { kind: "create-token", token: "Construct Token", count: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
