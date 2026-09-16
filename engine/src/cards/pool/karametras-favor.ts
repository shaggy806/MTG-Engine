import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

export default defineCard({
  name: "Karametra's Favor",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text:
    "Enchant creature\n" +
    "When Karametra's Favor enters, draw a card.\n" +
    'Enchanted creature has "{T}: Add one mana of any color."',
  targets: ["creature"],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Karametra's Favor enters, draw a card.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantsActivated: [
        addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." }),
      ],
      text: 'Enchanted creature has "{T}: Add one mana of any color."',
    },
  ],
});
