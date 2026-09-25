import { defineCard } from "../define.js";

export default defineCard({
  name: "Vault Skirge",
  manaCost: "{1}{B/P}",
  colors: ["B"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Imp"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "lifelink"],
  text: "({B/P} can be paid with either {B} or 2 life.)\nFlying\nLifelink (Damage dealt by this creature also causes you to gain that much life.)",
});
