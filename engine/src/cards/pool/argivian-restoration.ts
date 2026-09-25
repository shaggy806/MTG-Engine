import { defineCard } from "../define.js";

export default defineCard({
  name: "Argivian Restoration",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return target artifact card from your graveyard to the battlefield.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
});
