import { defineCard } from "../define.js";

export default defineCard({
  name: "Obyra, Dreaming Duelist",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Warrior"],
  power: 2,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\nWhenever another Faerie you control enters, each opponent loses 1 life.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { subtype: "Faerie" },
        otherOnly: true,
      },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever another Faerie you control enters, each opponent loses 1 life.",
    },
  ],
});
