import { defineCard } from "../define.js";

export default defineCard({
  name: "Izzet Charm",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Counter target noncreature spell unless its controller pays {2}.\n" +
    "• Izzet Charm deals 2 damage to target creature.\n" +
    "• Draw two cards, then discard two cards.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Counter target noncreature spell unless its controller pays {2}.",
        targets: ["noncreature-spell"],
        effect: {
          kind: "unless",
          chooser: 0,
          options: [{ pay: "{2}", text: "Pay {2}" }],
          otherwise: { kind: "counter", target: 0 },
        },
      },
      {
        text: "Izzet Charm deals 2 damage to target creature.",
        targets: ["creature"],
        effect: { kind: "damage", amount: 2, target: 0 },
      },
      {
        text: "Draw two cards, then discard two cards.",
        targets: [],
        effect: {
          kind: "sequence",
          effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 2 }],
        },
      },
    ],
  },
});
