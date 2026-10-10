import { defineCard } from "../define.js";

// EDHREC rank 3857. With its target illegal the spell does nothing at all,
// the temptation included (rule 608.2b).
export default defineCard({
  name: "Claim the Precious",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Destroy target creature. The Ring tempts you.",
  targets: ["creature"],
  effect: { kind: "sequence", effects: [{ kind: "destroy", target: 0 }, { kind: "the-ring-tempts-you" }] },
});
