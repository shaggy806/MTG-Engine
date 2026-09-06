import { defineCard } from "../define.js";

export default defineCard({
  name: "Raise the Alarm",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Create two 1/1 white Soldier creature tokens.",
  effect: { kind: "create-token", token: "Soldier Token", count: 2 },
});
