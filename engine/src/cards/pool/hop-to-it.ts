import { defineCard } from "../define.js";

// EDHREC rank 3845.
// Makes Rabbit → use "Rabbit Token".

export default defineCard({
  name: "Hop to It",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create three 1/1 white Rabbit creature tokens.",
  effect: { kind: "create-token", token: "Rabbit Token", count: 3 },
});
