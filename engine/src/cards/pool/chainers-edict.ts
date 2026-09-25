import { defineCard } from "../define.js";

export default defineCard({
  name: "Chainer's Edict",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  flashback: { cost: "{5}{B}{B}" },
  text: "Target player sacrifices a creature of their choice.\nFlashback {5}{B}{B} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["player"],
  effect: { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
});
