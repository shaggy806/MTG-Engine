import { defineCard } from "../define.js";

export default defineCard({
  name: "Obsessive Stitcher",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 0,
  toughness: 3,
  text: "{T}: Draw a card, then discard a card.\n{2}{U}{B}, {T}, Sacrifice this creature: Return target creature card from your graveyard to the battlefield.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{T}: Draw a card, then discard a card.",
    },
    {
      cost: { mana: "{2}{U}{B}", tap: true, sacrifice: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{2}{U}{B}, {T}, Sacrifice this creature: Return target creature card from your graveyard to the battlefield.",
    },
  ],
});
