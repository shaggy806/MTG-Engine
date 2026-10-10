import { defineCard } from "../define.js";

/** Blacksmith's Talent's colorless Equipment named Sword: "Equipped creature
 * gets +1/+1" and equip {2}. Keyed " Token", named by `tokenName`. */
export default defineCard({
  name: "Sword Token",
  tokenName: "Sword",
  art: "bb1e78e6-a9e7-48a4-9231-61fb331c5837",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "Equipped creature gets +1/+1\nEquip {2}",
  static: [{ affects: { scope: "attached" }, grantPt: [1, 1], text: "Equipped creature gets +1/+1" }],
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
});
