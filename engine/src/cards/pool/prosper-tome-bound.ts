import { defineCard } from "../define.js";

export default defineCard({
  name: "Prosper, Tome-Bound",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Tiefling", "Warlock"],
  power: 1,
  toughness: 4,
  keywords: ["deathtouch"],
  text:
    "Deathtouch\n" +
    "Mystic Arcanum — At the beginning of your end step, exile the top card of your library. Until the end of your next turn, you may play that card.\n" +
    "Pact Boon — Whenever you play a card from exile, create a Treasure token.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      // Exiled during your own end step, so the permission covers the rest of
      // this turn and all of your next one (`your-next-turn`).
      effect: { kind: "impulse-exile", amount: 1, duration: "your-next-turn" },
      resolve: null,
      text: "Mystic Arcanum — At the beginning of your end step, exile the top card of your library. Until the end of your next turn, you may play that card.",
    },
    {
      // Any card played from exile, not just Mystic Arcanum's: a land off an
      // impulse exile, a foretold, suspended, cascaded or adventure card.
      trigger: { on: "plays-card", who: "you", from: "exile" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Pact Boon — Whenever you play a card from exile, create a Treasure token.",
    },
  ],
});
