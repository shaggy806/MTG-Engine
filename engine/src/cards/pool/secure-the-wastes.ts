import { defineCard } from "../define.js";

export default defineCard({
  name: "Secure the Wastes",
  manaCost: "{X}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Create X 1/1 white Warrior creature tokens.",
  effect: { kind: "create-token", token: "Warrior Token", count: "x" },
});
