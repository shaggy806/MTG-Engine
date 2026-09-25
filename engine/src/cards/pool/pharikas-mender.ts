import { defineCard } from "../define.js";

export default defineCard({
  name: "Pharika's Mender",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Gorgon"],
  power: 4,
  toughness: 3,
  text: "When this creature enters, you may return target creature or enchantment card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["creature", "enchantment"] },
        },
      ],
      effect: {
        kind: "may",
        prompt: "Return target creature or enchantment card from your graveyard to your hand?",
        effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      },
      resolve: null,
      text: "When this creature enters, you may return target creature or enchantment card from your graveyard to your hand.",
    },
  ],
});
