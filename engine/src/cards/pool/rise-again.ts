import { defineCard } from "../define.js";

export default defineCard({
  name: "Rise Again",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Return target creature card from your graveyard to the battlefield.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
});
