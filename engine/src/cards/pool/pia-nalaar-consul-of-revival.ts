import { defineCard } from "../define.js";

// EDHREC rank 6088.
//
// Rulings:
//   [2023-05-12] Once a Thopter that came under your control this turn has legally attacked,
//     causing it to lose haste by removing Pia Nalaar won't remove that Thopter from combat. It
//     will just keep attacking. Good Thopter.

const HASTE_TEXT = "Thopters you control have haste.";
const PLAY_TEXT =
  "Whenever you play a land from exile or cast a spell from exile, create a 1/1 colorless Thopter artifact creature token with flying.";

export default defineCard({
  name: "Pia Nalaar, Consul of Revival",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 3,
  text: `${HASTE_TEXT}\n${PLAY_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Thopter", controlledBy: "you" } },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
  triggered: [
    {
      // Prosper, Tome-Bound's "whenever you play a card from exile": a land
      // played or a spell cast from exile.
      trigger: { on: "plays-card", who: "you", from: "exile" },
      targets: [],
      effect: { kind: "create-token", token: "Thopter Token", count: 1 },
      resolve: null,
      text: PLAY_TEXT,
    },
  ],
});
