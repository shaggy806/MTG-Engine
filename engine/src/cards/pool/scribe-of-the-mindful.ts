import { defineCard } from "../define.js";

export default defineCard({
  name: "Scribe of the Mindful",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  text: "{1}, {T}, Sacrifice this creature: Return target instant or sorcery card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["instant", "sorcery"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{1}, {T}, Sacrifice this creature: Return target instant or sorcery card from your graveyard to your hand.",
    },
  ],
});
