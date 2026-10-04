import { defineCard } from "../define.js";

// EDHREC rank 6404.
//
// Rulings:
//   [2004-10-04] The card does not go to the graveyard before being exiled.
//   [2004-10-04] If the spell is not countered (because the spell it targets can't be countered),
//     then it does not get exiled.

export default defineCard({
  name: "Dissipate",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell. If that spell is countered this way, exile it instead of putting it into its owner's graveyard.",
  targets: ["spell"],
  // `into: "exile"` is still a counter: a spell that can't be countered isn't exiled (ruling).
  effect: { kind: "counter", target: 0, into: "exile" },
});
