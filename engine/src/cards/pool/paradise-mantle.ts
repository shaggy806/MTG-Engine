import { defineCard } from "../define.js";
import { addManaAbility, equip } from "../helpers.js";

const TEXT = 'Equipped creature has "{T}: Add one mana of any color."';

export default defineCard({
  name: "Paradise Mantle",
  manaCost: "{0}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {1}`,
  static: [
    {
      affects: { scope: "attached" },
      grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
      text: TEXT,
    },
  ],
  activated: [equip("{1}")],
});
