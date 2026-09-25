import { defineCard } from "../define.js";

export default defineCard({
  name: "Groundskeeper",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 1,
  toughness: 1,
  text: "{1}{G}: Return target basic land card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { supertype: "basic", type: "land" },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{1}{G}: Return target basic land card from your graveyard to your hand.",
    },
  ],
});
