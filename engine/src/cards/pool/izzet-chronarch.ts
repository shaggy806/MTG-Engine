import { defineCard } from "../define.js";

export default defineCard({
  name: "Izzet Chronarch",
  manaCost: "{3}{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
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
