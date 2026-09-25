import { defineCard } from "../define.js";

export default defineCard({
  name: "Zealous Lorecaster",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant", "Sorcerer"],
  power: 4,
  toughness: 4,
  text: "When this creature enters, return target instant or sorcery card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["instant", "sorcery"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target instant or sorcery card from your graveyard to your hand.",
    },
  ],
});
