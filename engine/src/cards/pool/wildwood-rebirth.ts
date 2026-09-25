import { defineCard } from "../define.js";

export default defineCard({
  name: "Wildwood Rebirth",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Return target creature card from your graveyard to your hand.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
});
