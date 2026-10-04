import { defineCard } from "../define.js";

// EDHREC rank 4275.
//
// Rulings:
//   [2025-04-04] If multiple cards leave your graveyard at the same time, Kheru Goldkeeper's
//     triggered ability will trigger only once.
//   [2025-04-04] If a card with a renew ability is put into your graveyard during your turn, you
//     can activate that ability if it's legal to do so before any other player can take any
//     actions.
//
// "One or more cards leave your graveyard" is the batched `leaves-graveyard`
// trigger (Teval's shape); "during your turn" is Kishla Skimmer's condition.

const LEAVE_TEXT =
  "Whenever one or more cards leave your graveyard during your turn, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")";
const RENEW_TEXT =
  "Renew — {2}{B}{G}{U}, Exile this card from your graveyard: Put two +1/+1 counters and a flying counter on target creature. Activate only as a sorcery.";

export default defineCard({
  name: "Kheru Goldkeeper",
  manaCost: "{1}{B}{G}{U}",
  colors: ["U", "B", "G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${LEAVE_TEXT}\n${RENEW_TEXT}`,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you" },
      condition: { kind: "your-turn" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: LEAVE_TEXT,
    },
  ],
  activated: [
    {
      // `zone: "graveyard"` pays "Exile this card from your graveyard" (renew, as Qarsi Revenant).
      cost: { mana: "{2}{B}{G}{U}", tap: false },
      targets: ["creature"],
      // A flying counter is a keyword counter (rule 122.1b).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
          { kind: "add-counter", target: 0, counter: "flying", amount: 1 },
        ],
      },
      resolve: null,
      text: RENEW_TEXT,
      zone: "graveyard",
      sorcerySpeed: true,
    },
  ],
});
