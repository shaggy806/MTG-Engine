import { defineCard } from "../define.js";

// EDHREC rank 5635.
// Makes Clue → uses "Clue Token".
//
// A permanent card is any but an instant or a sorcery (Peerless Recycling's
// filter). Making the Clue isn't investigating (the ruling): a plain
// `create-token`.
//
// Rulings:
//   [2025-10-02] Creating a Clue token this way isn't the same thing as investigating. Notably, an
//     ability that triggers whenever you investigate won't trigger because of creating a Clue
//     token this way.
//   [2025-10-02] Clue tokens are artifact tokens with "{2}, Sacrifice this token: Draw a card."

export default defineCard({
  name: "True Ancestry",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Return up to one target permanent card from your graveyard to your hand.\nCreate a Clue token. (It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: [
    {
      kind: "optional",
      of: { kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["instant", "sorcery"] } },
    },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0, from: "graveyard" },
      { kind: "create-token", token: "Clue Token", count: 1 },
    ],
  },
});
