import { defineCard } from "../define.js";

// needed-cards P16. Ships the landfall loot half only (already-shipped
// vocab — a "you may" wrapping a discard-then-draw sequence). The "Summon"
// activated ability — return a target Saga card from the graveyard with a
// finality counter (rule 122.3e-adjacent: exiled instead of leaving the
// battlefield again) — is dropped: no TargetSpec for "a Saga card in your
// graveyard" exists, and finality counters aren't modeled as a replacement
// at all. Both are real gaps, but this is the only card on the list that
// needs either.
export default defineCard({
  name: "Rydia, Summoner of Mist",
  manaCost: "{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 2,
  text: "Landfall — Whenever a land you control enters, you may discard a card. If you do, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard a card, then draw a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            { kind: "draw", amount: 1 },
          ],
        },
      },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, you may discard a card. If you do, draw a card.",
    },
  ],
});
