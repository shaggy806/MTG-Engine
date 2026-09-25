import { defineCard } from "../define.js";

export default defineCard({
  name: "Recover",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Return target creature card from your graveyard to your hand.\nDraw a card.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: {
    kind: "sequence",
    effects: [{ kind: "return-to-hand", target: 0, from: "graveyard" }, { kind: "draw", amount: 1 }],
  },
});
