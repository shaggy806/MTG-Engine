import { demonstrate } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Replication Technique",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text:
    "Demonstrate (When you cast this spell, you may copy it. If you do, choose an opponent to also copy it. " +
    "Players may choose new targets for their copies.)\nCreate a token that's a copy of target permanent you control.",
  targets: [{ kind: "permanent", whose: "you", filter: {} }],
  effect: { kind: "create-token-copy", of: 0, count: 1 },
  triggered: [demonstrate()],
});
