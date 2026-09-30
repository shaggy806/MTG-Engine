import { defineCard } from "../define.js";

// Green Sun's Zenith's shuffle: only on resolving, so a countered one goes
// to the graveyard.
export default defineCard({
  name: "Blue Sun's Zenith",
  manaCost: "{X}{U}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Target player draws X cards. Shuffle Blue Sun's Zenith into its owner's library.",
  targets: ["player"],
  effect: { kind: "draw", amount: "x", target: 0 },
  shuffleIntoLibraryOnResolve: true,
});
