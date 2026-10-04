import { defineCard } from "../define.js";

// EDHREC rank 5255.
//
// Rulings:
//   [2017-09-29] If the damage that would be dealt by Rile is prevented, the creature still gains
//     trample until end of turn.
//   [2017-09-29] If Rile targets a creature with 1 toughness, that creature won't be destroyed
//     until after you've drawn a card. Its abilities may affect that draw or trigger on that draw
//     if appropriate.
//   [2017-09-29] If the target creature is an illegal target by the time Rile resolves, the entire
//     spell doesn't resolve. You won't draw a card.

export default defineCard({
  name: "Rile",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Rile deals 1 damage to target creature you control. That creature gains trample until end of turn.\nDraw a card.",
  targets: ["creature-you-control"],
  // The trample is granted even if the damage is prevented, and a 1-toughness
  // creature dies only after the draw (state-based actions wait) — the rulings.
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 1, target: 0 },
      { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      { kind: "draw", amount: 1 },
    ],
  },
});
