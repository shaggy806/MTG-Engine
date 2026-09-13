import { defineCard } from "../define.js";

export default defineCard({
  name: "Wilt-Leaf Cavaliers",
  manaCost: "{G/W}{G/W}{G/W}",
  colors: ["G", "W"],
  types: ["creature"],
  subtypes: ["Elf", "Knight"],
  power: 3,
  toughness: 4,
  keywords: ["vigilance"],
  text: "Vigilance ({G/W} can be paid with either {G} or {W}.)",
});
