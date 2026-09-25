import { defineCard } from "../define.js";

export default defineCard({
  name: "Devil's Play",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["sorcery"],
  flashback: { cost: "{X}{R}{R}{R}" },
  text: "Devil's Play deals X damage to any target.\nFlashback {X}{R}{R}{R} (You may cast this card from your graveyard for its flashback cost. Then exile it.)",
  targets: ["any-target"],
  effect: { kind: "damage", amount: "x", target: 0 },
});
