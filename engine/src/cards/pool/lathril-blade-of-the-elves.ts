import { defineCard } from "../define.js";

// Rulings:
//   [2021-02-05] You can tap any ten untapped Elves you control, including ones you haven't
//     controlled continuously since the beginning of your most recent turn, to pay that part of
//     the cost of Lathril's activated ability. You must have controlled Lathril continuously since
//     the beginning of your most recent turn, however. Lathril doesn't count as one of the ten.

export default defineCard({
  name: "Lathril, Blade of the Elves",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Noble"],
  power: 2,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\nWhenever Lathril deals combat damage to a player, create that many 1/1 green Elf Warrior creature tokens.\n{T}, Tap ten untapped Elves you control: Each opponent loses 10 life and you gain 10 life.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        tapOthers: { count: 10, filter: { subtype: "Elf", controlledBy: "you" } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 10, who: "each-opponent" },
          { kind: "gain-life", amount: 10 },
        ],
      },
      resolve: null,
      text: "{T}, Tap ten untapped Elves you control: Each opponent loses 10 life and you gain 10 life.",
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      // "That many" — the combat damage just dealt.
      effect: { kind: "create-token", token: "Elf Warrior Token", count: { triggerValue: true } },
      resolve: null,
      text: "Whenever Lathril deals combat damage to a player, create that many 1/1 green Elf Warrior creature tokens.",
    },
  ],
});
