import { defineCard } from "../define.js";

export default defineCard({
  name: "Storm Herd",
  manaCost: "{8}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create X 1/1 white Pegasus creature tokens with flying, where X is your life total.",
  effect: {
    kind: "create-token",
    token: "Pegasus Token",
    count: { lifeTotal: "you" },
  },
});
