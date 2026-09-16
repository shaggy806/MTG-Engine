import { defineCard } from "../define.js";

/** 2/2 black Zombie Knight with menace — Josu Vess, Lich Knight's kicked
 * half. */
export default defineCard({
  name: "Zombie Knight Token",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace",
});
