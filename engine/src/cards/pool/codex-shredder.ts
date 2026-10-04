import { defineCard } from "../define.js";

// EDHREC rank 2408. The return's target is chosen before the costs are paid,
// so it can't be the Shredder itself (the ruling): it's still on the
// battlefield as the target is picked.
export default defineCard({
  name: "Codex Shredder",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Target player mills a card. (They put the top card of their library into their graveyard.)\n{5}, {T}, Sacrifice this artifact: Return target card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 1 },
      resolve: null,
      text: "{T}: Target player mills a card.",
    },
    {
      cost: { mana: "{5}", tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you" }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{5}, {T}, Sacrifice this artifact: Return target card from your graveyard to your hand.",
    },
  ],
});
