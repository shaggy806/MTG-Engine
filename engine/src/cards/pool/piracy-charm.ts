import { defineCard } from "../define.js";

export default defineCard({
  name: "Piracy Charm",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Choose one —\n• Target creature gains islandwalk until end of turn. (It can't be blocked as long as defending player controls an Island.)\n• Target creature gets +2/-1 until end of turn.\n• Target player discards a card.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Target creature gains islandwalk until end of turn.",
        targets: ["creature"],
        effect: { kind: "grant-keyword", target: 0, keyword: "islandwalk", duration: "end-of-turn" },
      },
      {
        text: "Target creature gets +2/-1 until end of turn.",
        targets: ["creature"],
        effect: { kind: "modify-pt", target: 0, power: 2, toughness: -1, duration: "end-of-turn" },
      },
      {
        text: "Target player discards a card.",
        targets: ["player"],
        effect: { kind: "discard", target: 0, amount: 1 },
      },
    ],
  },
});
