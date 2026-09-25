import { defineCard } from "../define.js";

export default defineCard({
  name: "Bounty of Might",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gets +3/+3 until end of turn.\nTarget creature gets +3/+3 until end of turn.\nTarget creature gets +3/+3 until end of turn.",
  targets: ["creature", "creature", "creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      { kind: "modify-pt", target: 1, power: 3, toughness: 3, duration: "end-of-turn" },
      { kind: "modify-pt", target: 2, power: 3, toughness: 3, duration: "end-of-turn" },
    ],
  },
});
