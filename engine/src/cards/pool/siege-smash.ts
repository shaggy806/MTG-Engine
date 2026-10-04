import { defineCard } from "../define.js";

// EDHREC rank 3165.

export default defineCard({
  name: "Siege Smash",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "Split second (As long as this spell is on the stack, players can't cast spells or activate abilities that aren't mana abilities.)\n" +
    "Choose one —\n" +
    "• Destroy target artifact.\n" +
    "• Target creature gets +3/+2 and gains trample until end of turn.",
  splitSecond: true,
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Destroy target artifact.",
        targets: ["artifact"],
        effect: { kind: "destroy", target: 0 },
      },
      {
        text: "Target creature gets +3/+2 and gains trample until end of turn.",
        targets: ["creature"],
        effect: {
          kind: "sequence",
          effects: [
            { kind: "modify-pt", target: 0, power: 3, toughness: 2, duration: "end-of-turn" },
            { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
          ],
        },
      },
    ],
  },
});
