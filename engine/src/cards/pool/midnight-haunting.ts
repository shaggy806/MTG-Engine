import { defineCard } from "../define.js";

export default defineCard({
  name: "Midnight Haunting",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Create two 1/1 white Spirit creature tokens with flying.",
  effect: { kind: "create-token", token: "Spirit Token", count: 2 },
});
