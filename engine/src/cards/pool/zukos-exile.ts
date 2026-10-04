import { defineCard } from "../define.js";

// EDHREC rank 4427.
// Ravenform's shape: the exiled permanent's last-known controller creates the
// token (rule 111.11).
//
// Rulings:
//   [2025-10-02] Clue tokens are artifact tokens with "{2}, Sacrifice this token: Draw a card."
//   [2025-10-02] Creating a Clue token this way isn't the same thing as investigating. Notably, an
//     ability that triggers whenever you investigate won't trigger because of creating a Clue
//     token this way.

export default defineCard({
  name: "Zuko's Exile",
  manaCost: "{5}",
  colors: [],
  types: ["instant"],
  subtypes: ["Lesson"],
  text: "Exile target artifact, creature, or enchantment. Its controller creates a Clue token. (It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "creature", "enchantment"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile", target: 0 },
      { kind: "create-token", token: "Clue Token", count: 1, who: "target-controller" },
    ],
  },
});
