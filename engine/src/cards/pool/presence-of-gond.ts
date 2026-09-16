import { defineCard } from "../define.js";

export default defineCard({
  name: "Presence of Gond",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    "Enchant creature\n" +
    'Enchanted creature has "{T}: Create a 1/1 green Elf Warrior creature token."',
  targets: ["creature"],
  static: [
    {
      affects: { scope: "attached" },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
          resolve: null,
          text: "{T}: Create a 1/1 green Elf Warrior creature token.",
        },
      ],
      text: 'Enchanted creature has "{T}: Create a 1/1 green Elf Warrior creature token."',
    },
  ],
});
