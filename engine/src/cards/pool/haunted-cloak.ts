import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const TEXT = "Equipped creature has vigilance, trample, and haste.";

export default defineCard({
  name: "Haunted Cloak",
  manaCost: "{3}",
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${TEXT}\nEquip {1}`,
  static: [{ affects: { scope: "attached" }, grantKeywords: ["vigilance", "trample", "haste"], text: TEXT }],
  activated: [equip("{1}")],
});
