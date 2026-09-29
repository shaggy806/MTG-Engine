import { defineCard } from "../define.js";

const LORD_TEXT = "Other Elves you control get +1/+1.";
const TOKEN_TEXT = "{G}, {T}: Create a 1/1 green Elf Warrior creature token.";

export default defineCard({
  name: "Imperious Perfect",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${LORD_TEXT}\n${TOKEN_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Elf" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Elf Warrior Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
