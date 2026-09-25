import { defineCard } from "../define.js";

export default defineCard({
  name: "Obzedat's Aid",
  manaCost: "{3}{W}{B}",
  colors: ["W", "B"],
  types: ["sorcery"],
  text: "Return target permanent card from your graveyard to the battlefield.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["instant", "sorcery"] } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
});
