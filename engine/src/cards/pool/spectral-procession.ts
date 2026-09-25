import { defineCard } from "../define.js";

export default defineCard({
  name: "Spectral Procession",
  manaCost: "{2/W}{2/W}{2/W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create three 1/1 white Spirit creature tokens with flying.",
  effect: { kind: "create-token", token: "Spirit Token", count: 3 },
});
