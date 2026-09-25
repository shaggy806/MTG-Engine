import { defineCard } from "../define.js";

export default defineCard({
  name: "Refurbish",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Return target artifact card from your graveyard to the battlefield.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } }],
  effect: { kind: "put-onto-battlefield", target: 0 },
});
