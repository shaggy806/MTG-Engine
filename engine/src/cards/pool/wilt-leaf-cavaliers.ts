import { defineCard } from "../define.js";

export default defineCard({
  name: "Wilt-Leaf Cavaliers",
  manaCost: "{2}{G/W}{G/W}",
  colors: ["G", "W"],
  types: ["creature"],
  subtypes: ["Elf", "Knight"],
  power: 5,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample ({G/W} can be paid with either {G} or {W}.)",
});
