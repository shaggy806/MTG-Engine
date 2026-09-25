import { defineCard } from "../define.js";

export default defineCard({
  name: "Scarecrone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 1,
  toughness: 2,
  text: "{1}, Sacrifice a Scarecrow: Draw a card.\n{4}, {T}: Return target artifact creature card from your graveyard to the battlefield.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: { filter: { subtype: "Scarecrow" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice a Scarecrow: Draw a card.",
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { types: ["artifact", "creature"] },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "{4}, {T}: Return target artifact creature card from your graveyard to the battlefield.",
    },
  ],
});
