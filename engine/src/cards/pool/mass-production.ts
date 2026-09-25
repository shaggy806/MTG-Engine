import { defineCard } from "../define.js";

export default defineCard({
  name: "Mass Production",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Create four 1/1 colorless Soldier artifact creature tokens.",
  effect: { kind: "create-token", token: "Soldier Artifact Token", count: 4 },
});
