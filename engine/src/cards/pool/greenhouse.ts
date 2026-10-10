import { defineCard } from "../define.js";
import { ROOM_REMINDER, addManaAbility } from "../helpers.js";

// The left door of Greenhouse // Rickety Gazebo (greenhouse-rickety-gazebo.ts).
const LANDS = 'Lands you control have "{T}: Add one mana of any color."';

export default defineCard({
  name: "Greenhouse",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${LANDS}\n${ROOM_REMINDER}`,
  static: [{ affects: { scope: "lands-you-control" }, grantsActivated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })], text: LANDS }],
  faces: ["Greenhouse // Rickety Gazebo", "Greenhouse", "Rickety Gazebo"],
  split: true,
});
