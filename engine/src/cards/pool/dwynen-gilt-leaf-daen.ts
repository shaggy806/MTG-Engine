import { defineCard } from "../define.js";

// EDHREC rank 2626.
//
// Rulings:
//   [2015-06-22] Count the number of attacking Elves you control as Dwynen's last ability resolves
//     to determine how much life to gain.

const LORD_TEXT = "Other Elf creatures you control get +1/+1.";
const ATTACK_TEXT = "Whenever Dwynen attacks, you gain 1 life for each attacking Elf you control.";

export default defineCard({
  name: "Dwynen, Gilt-Leaf Daen",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 3,
  toughness: 4,
  keywords: ["reach"],
  text: `Reach (This creature can block creatures with flying.)\n${LORD_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      // Counted as it resolves (the ruling) — Dwynen itself included, an
      // attacking Elf.
      effect: {
        kind: "gain-life",
        amount: { countOf: { type: "creature", subtype: "Elf", controlledBy: "you", attacking: true } },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Elf" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
});
