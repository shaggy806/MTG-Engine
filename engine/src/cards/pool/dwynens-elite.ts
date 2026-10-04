import { defineCard } from "../define.js";

// EDHREC rank 5603.
// Makes Elf Warrior → use "Elf Warrior Token".
//
// Rulings:
//   [2024-11-08] Dwynen's Elite's ability checks at the moment it would trigger to see if you
//     control another Elf. If you don't, the ability won't trigger at all. If it does trigger, the
//     ability will check again as it tries to resolve. If you don't control another Elf at that
//     time, the ability won't resolve and none of its effects will happen.

export default defineCard({
  name: "Dwynen's Elite",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, if you control another Elf, create a 1/1 green Elf Warrior creature token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // Intervening-if (rule 603.4): checked as it triggers and as it resolves.
      condition: { kind: "controls", filter: { subtype: "Elf" }, atLeast: 1, excludeSelf: true },
      targets: [],
      effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
      resolve: null,
      text: "When this creature enters, if you control another Elf, create a 1/1 green Elf Warrior creature token.",
    },
  ],
});
