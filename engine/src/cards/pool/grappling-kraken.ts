import { defineCard } from "../define.js";

// EDHREC rank 5578.
//
// Rulings:
//   [2024-11-08] A landfall ability doesn't trigger if a permanent already on the battlefield
//     becomes a land.
//   [2024-11-08] A landfall ability triggers whenever a land you control enters for any reason. It
//     triggers whenever you play a land, as well as whenever a spell or ability puts a land onto
//     the battlefield under your control.
//   [2024-11-08] You may target a creature that's already tapped with Grappling Kraken's ability.
//     In that case, you'll just put a stun counter on that creature.
const TEXT =
  "Landfall — Whenever a land you control enters, tap target creature an opponent controls and put a stun counter on it.";

export default defineCard({
  name: "Grappling Kraken",
  manaCost: "{4}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 5,
  toughness: 6,
  text: `${TEXT} (If a permanent with a stun counter would become untapped, remove one from it instead.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "tap", target: 0 },
          { kind: "add-counter", target: 0, counter: "stun", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
