import { defineCard } from "../define.js";

// EDHREC rank 3364.
// Makes Human → "Human Token".
//
// Rulings:
//   [2021-03-19] You must still follow any timing restrictions and permissions, including those
//     based on the card's type. For instance, you can cast a sorcery using flashback only when you
//     could normally cast a sorcery.
//   [2021-03-19] A spell cast using flashback will always be exiled afterward, whether it
//     resolves, is countered, or leaves the stack in some other way.
//   [2021-03-19] You can cast a spell using flashback even if it was somehow put into your
//     graveyard without having been cast.

export default defineCard({
  name: "Increasing Devotion",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  flashback: { cost: "{7}{W}{W}" },
  text: "Create five 1/1 white Human creature tokens. If this spell was cast from a graveyard, create ten of those tokens instead.\nFlashback {7}{W}{W} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  // Increasing Vengeance's shape: "cast from a graveyard" reads where the
  // spell was cast from, flashback or any other graveyard permission.
  effect: {
    kind: "create-token",
    token: "Human Token",
    count: { ifCondition: { kind: "source", filter: { castFrom: "graveyard" } }, then: 10, else: 5 },
  },
});
