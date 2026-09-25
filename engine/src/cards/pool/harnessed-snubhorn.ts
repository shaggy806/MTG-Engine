import { defineCard } from "../define.js";

export default defineCard({
  name: "Harnessed Snubhorn",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 2,
  toughness: 5,
  keywords: ["vigilance"],
  text: "Vigilance\nWhenever this creature deals combat damage to a player, return target artifact or enchantment card from your graveyard to the battlefield.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["artifact", "enchantment"] },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, return target artifact or enchantment card from your graveyard to the battlefield.",
    },
  ],
});
