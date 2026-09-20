import { defineCard } from "../define.js";

/** 2/2 black Zombie Knight with menace — Josu Vess, Lich Knight's kicked
 * half. */
export default defineCard({
  name: "Zombie Knight Token",
  art: "1b514e92-dbb1-4d58-92b4-6347de53a90b",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace",
});
