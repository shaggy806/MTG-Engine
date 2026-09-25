import { defineCard } from "../define.js";

export default defineCard({
  name: "Dross Skullbomb",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{1}, Sacrifice this artifact: Draw a card.\n{2}{B}, Sacrifice this artifact: Return target creature card from your graveyard to your hand. Draw a card. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice this artifact: Draw a card.",
    },
    {
      cost: { mana: "{2}{B}", tap: false, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [{ kind: "return-to-hand", target: 0, from: "graveyard" }, { kind: "draw", amount: 1 }],
      },
      resolve: null,
      text: "{2}{B}, Sacrifice this artifact: Return target creature card from your graveyard to your hand. Draw a card. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
