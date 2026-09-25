import { defineCard } from "../define.js";

export default defineCard({
  name: "Savage Twister",
  manaCost: "{X}{R}{G}",
  colors: ["R", "G"],
  types: ["sorcery"],
  text: "Savage Twister deals X damage to each creature.",
  effect: { kind: "damage-all", amount: "x", filter: { type: "creature" } },
});
