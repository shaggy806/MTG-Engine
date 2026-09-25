import { defineCard } from "../define.js";

export default defineCard({
  name: "Pillardrop Warden",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Spirit", "Dwarf"],
  power: 1,
  toughness: 5,
  keywords: ["reach"],
  text: "Reach\n{2}, {T}, Sacrifice this creature: Return target instant or sorcery card from your graveyard to your hand. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["instant", "sorcery"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{2}, {T}, Sacrifice this creature: Return target instant or sorcery card from your graveyard to your hand. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
