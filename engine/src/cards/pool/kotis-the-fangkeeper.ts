import { defineCard } from "../define.js";

// EDHREC rank 5327. X is the combat damage Kotis dealt; "their library" the
// damaged player's.
const HIT =
  "Whenever Kotis deals combat damage to a player, exile the top X cards of their library, where X is the amount of damage dealt. You may cast any number of spells with mana value X or less from among them without paying their mana costs.";

export default defineCard({
  name: "Kotis, the Fangkeeper",
  manaCost: "{1}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Warrior"],
  power: 2,
  toughness: 1,
  keywords: ["indestructible"],
  text: `Indestructible\n${HIT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-from-library", whose: "trigger-player", amount: { triggerValue: true } },
          {
            kind: "cast-now",
            from: "exiled-this-way",
            free: true,
            repeat: true,
            spell: { manaValue: { op: "lte", n: { amount: { triggerValue: true } } } },
          },
        ],
      },
      resolve: null,
      text: HIT,
    },
  ],
});
