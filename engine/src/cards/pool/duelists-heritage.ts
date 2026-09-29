import { defineCard } from "../define.js";

const TEXT =
  "Whenever one or more creatures attack, you may have target attacking creature gain double strike until end of turn.";

// Any player's attack, not only yours; the target is chosen knowing who is
// attacking whom (the ruling).
export default defineCard({
  name: "Duelist's Heritage",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "attack-with", who: "any", atLeast: 1 },
      targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }],
      effect: {
        kind: "may",
        prompt: "Give it double strike?",
        effect: { kind: "grant-keyword", target: 0, keyword: "double-strike", duration: "end-of-turn" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
