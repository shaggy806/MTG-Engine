import { defineCard } from "../define.js";

export default defineCard({
  name: "Spellkeeper Weird",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Weird"],
  power: 1,
  toughness: 4,
  text: "{2}, {T}, Sacrifice this creature: Return target instant or sorcery card from your graveyard to your hand.",
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
      text: "{2}, {T}, Sacrifice this creature: Return target instant or sorcery card from your graveyard to your hand.",
    },
  ],
});
