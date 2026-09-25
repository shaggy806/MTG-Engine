import { defineCard } from "../define.js";

export default defineCard({
  name: "Golgari Findbroker",
  manaCost: "{B}{B}{G}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 3,
  toughness: 4,
  text: "When this creature enters, return target permanent card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { notTypes: ["instant", "sorcery"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target permanent card from your graveyard to your hand.",
    },
  ],
});
