import { defineCard } from "../define.js";

export default defineCard({
  name: "Captain's Call",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create three 1/1 white Soldier creature tokens.",
  effect: { kind: "create-token", token: "Soldier Token", count: 3 },
});
