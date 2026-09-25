import { defineCard } from "../define.js";

export default defineCard({
  name: "Living Lightning",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Shaman"],
  power: 3,
  toughness: 2,
  text: "When this creature dies, return target instant or sorcery card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["instant", "sorcery"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature dies, return target instant or sorcery card from your graveyard to your hand.",
    },
  ],
});
