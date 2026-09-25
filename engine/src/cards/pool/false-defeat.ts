import { defineCard } from "../define.js";

export default defineCard({
  name: "False Defeat",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Return target creature card from your graveyard to the battlefield.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
});
