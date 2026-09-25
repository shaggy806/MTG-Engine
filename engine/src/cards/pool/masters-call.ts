import { defineCard } from "../define.js";

export default defineCard({
  name: "Master's Call",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Create two 1/1 colorless Myr artifact creature tokens.",
  effect: { kind: "create-token", token: "Myr Token", count: 2 },
});
