import { defineCard } from "../define.js";

export default defineCard({
  name: "Call to Mind",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return target instant or sorcery card from your graveyard to your hand.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
