import { defineCard } from "../define.js";

// EDHREC rank 4999.
//
// Academy Ruins' shape, any card.
export default defineCard({
  name: "Reclaim",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Put target card from your graveyard on top of your library.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: {} }],
  effect: { kind: "put-on-library", target: 0, position: "top" },
});
