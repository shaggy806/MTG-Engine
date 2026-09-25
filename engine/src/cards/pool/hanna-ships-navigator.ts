import { defineCard } from "../define.js";

export default defineCard({
  name: "Hanna, Ship's Navigator",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 1,
  toughness: 2,
  text: "{1}{W}{U}, {T}: Return target artifact or enchantment card from your graveyard to your hand.",
  activated: [
    {
      cost: { mana: "{1}{W}{U}", tap: true },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["artifact", "enchantment"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "{1}{W}{U}, {T}: Return target artifact or enchantment card from your graveyard to your hand.",
    },
  ],
});
