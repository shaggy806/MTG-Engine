import { defineCard } from "../define.js";

export default defineCard({
  name: "Fires of Yavimaya",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  types: ["enchantment"],
  text:
    "Creatures you control have haste.\n" +
    "Sacrifice Fires of Yavimaya: Target creature gets +2/+2 until end of turn.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: {
        kind: "modify-pt",
        target: 0,
        power: 2,
        toughness: 2,
        duration: "end-of-turn",
      },
      resolve: null,
      text: "Sacrifice Fires of Yavimaya: Target creature gets +2/+2 until end of turn.",
    },
  ],
});
