import { defineCard } from "../define.js";

export default defineCard({
  name: "Diregraf Captain",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Zombie", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  text:
    "Deathtouch\n" +
    "Other Zombie creatures you control get +1/+1.\n" +
    "Whenever another Zombie you control dies, target opponent loses 1 life.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other Zombie creatures you control get +1/+1.",
    },
  ],
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { subtype: "Zombie" },
        otherOnly: true,
      },
      targets: ["opponent"],
      effect: { kind: "lose-life", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever another Zombie you control dies, target opponent loses 1 life.",
    },
  ],
});
