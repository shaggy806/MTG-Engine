import { defineCard } from "../define.js";

export default defineCard({
  name: "Moriok Scavenger",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 3,
  text: "When this creature enters, you may return target artifact creature card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { types: ["artifact", "creature"] },
        },
      ],
      effect: {
        kind: "may",
        prompt: "Return target artifact creature card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "When this creature enters, you may return target artifact creature card from your graveyard to your hand.",
    },
  ],
});
