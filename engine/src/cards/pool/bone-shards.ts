import { defineCard } from "../define.js";

// EDHREC rank 2760.
//
// Rulings:
//   [2021-06-18] Once you begin to cast Bone Shards, no player may take actions until you're done.
//     Notably, opponents can't try to remove the creature you wish to sacrifice or make you
//     discard your last card.
//   [2021-06-18] You must sacrifice exactly one creature or discard exactly one card to cast this
//     spell; you can't cast it without sacrificing a creature or discarding a card, and you can't
//     sacrifice additional creatures or discard additional cards.
//
// A choice between two whole additional costs (Demand Answers' shape): each is
// its own castable variant, and exactly one is paid.

export default defineCard({
  name: "Bone Shards",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice a creature or discard a card.\nDestroy target creature or planeswalker.",
  additionalCost: {
    options: [
      { text: "Sacrifice a creature", sacrifice: { type: "creature", controlledBy: "you" } },
      { text: "Discard a card", discard: 1 },
    ],
  },
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "destroy", target: 0 },
});
