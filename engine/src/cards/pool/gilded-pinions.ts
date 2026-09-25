import { defineCard } from "../define.js";

export default defineCard({
  name: "Gilded Pinions",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "When this Equipment enters, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")\nEquipped creature has flying.\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: ["creature-you-control"],
      effect: { kind: "attach", target: 0 },
      resolve: null,
      text: "Equip {2}",
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "When this Equipment enters, create a Treasure token.",
    },
  ],
  static: [
    {
      affects: { scope: "attached" },
      grantKeywords: ["flying"],
      text: "Equipped creature has flying.",
    },
  ],
});
