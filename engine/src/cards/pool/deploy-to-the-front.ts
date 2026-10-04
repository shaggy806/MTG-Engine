import { defineCard } from "../define.js";

// EDHREC rank 6154.
// Makes Soldier → use "Soldier Token".
// X counts every creature on the battlefield, each player's, as the spell resolves.

export default defineCard({
  name: "Deploy to the Front",
  manaCost: "{5}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create X 1/1 white Soldier creature tokens, where X is the number of creatures on the battlefield.",
  effect: { kind: "create-token", token: "Soldier Token", count: { countOf: { type: "creature" } } },
});
