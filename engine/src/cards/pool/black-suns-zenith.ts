import { defineCard } from "../define.js";

// Green Sun's Zenith's shuffle: only on resolving.
export default defineCard({
  name: "Black Sun's Zenith",
  manaCost: "{X}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Put X -1/-1 counters on each creature. Shuffle Black Sun's Zenith into its owner's library.",
  effect: { kind: "add-counter-all", filter: { type: "creature" }, counter: "-1/-1", amount: "x" },
  shuffleIntoLibraryOnResolve: true,
});
