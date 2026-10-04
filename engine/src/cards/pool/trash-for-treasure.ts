import { defineCard } from "../define.js";

// EDHREC rank 3873.
//
// Rulings:
//   [2020-08-07] You can't sacrifice an artifact to generate mana to pay towards Trash for
//     Treasure's cost and also to pay its additional cost.
//   [2020-08-07] The artifact that you sacrifice is sacrificed after determining the total cost to
//     cast Trash for Treasure. Its abilities may affect that cost.
//   [2020-08-07] Trash for Treasure can't target the artifact that you sacrifice to pay its
//     additional cost.

export default defineCard({
  name: "Trash for Treasure",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice an artifact.\nReturn target artifact card from your graveyard to the battlefield.",
  // Targets are checked before the sacrifice is paid, so the artifact
  // sacrificed can't be the one returned (the ruling).
  additionalCost: { sacrifice: { type: "artifact", controlledBy: "you" } },
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
});
