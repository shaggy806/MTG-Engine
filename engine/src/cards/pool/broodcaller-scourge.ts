import { defineCard } from "../define.js";

const TEXT =
  "Whenever one or more Dragons you control deal combat damage to a player, you may put a permanent card with mana value less than or equal to that damage from your hand onto the battlefield.";

// Once per player dealt damage; "that damage" is what the Dragons dealt that
// player in one combat damage step.
export default defineCard({
  name: "Broodcaller Scourge",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 7,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { subtype: "Dragon" }, combat: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: {
          typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
          manaValue: { op: "lte", n: { amount: { triggerValue: true } } },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
