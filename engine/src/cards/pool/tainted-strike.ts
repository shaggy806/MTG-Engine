import { defineCard } from "../define.js";

export default defineCard({
  name: "Tainted Strike",
  manaCost: "{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gets +1/+0 and gains infect until end of turn. (It deals damage to creatures in the form of -1/-1 counters and to players in the form of poison counters.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "infect", duration: "end-of-turn" },
    ],
  },
});
