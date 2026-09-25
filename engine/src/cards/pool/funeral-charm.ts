import { defineCard } from "../define.js";

export default defineCard({
  name: "Funeral Charm",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Choose one —\n• Target player discards a card.\n• Target creature gets +2/-1 until end of turn.\n• Target creature gains swampwalk until end of turn. (It can't be blocked as long as defending player controls a Swamp.)",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target player discards a card.",
        targets: ["player"],
        effect: { kind: "discard", target: 0, amount: 1 },
      },
      {
        text: "Target creature gets +2/-1 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: 2, toughness: -1, duration: "end-of-turn" },
      },
      {
        text: "Target creature gains swampwalk until end of turn.",
        targets: ["creature"],
        effect: { kind: "grant-keyword", target: 0, keyword: "swampwalk", duration: "end-of-turn" },
      },
    ],
  },
});
