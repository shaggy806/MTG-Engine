import { defineCard } from "../define.js";

export default defineCard({
  name: "Release the Dogs",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create four 1/1 white Dog creature tokens.",
  effect: { kind: "create-token", token: "1/1 White Dog Token", count: 4 },
});
