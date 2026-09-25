import { defineCard } from "../define.js";

export default defineCard({
  name: "Gorgon Flail",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +1/+1 and has deathtouch. (Any amount of damage it deals to a creature is enough to destroy that creature.)\nEquip {2} ({2}: Attach to target creature you control. Equip only as a sorcery.)",
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
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [1, 1],
      grantKeywords: ["deathtouch"],
      text: "Equipped creature gets +1/+1 and has deathtouch.",
    },
  ],
});
