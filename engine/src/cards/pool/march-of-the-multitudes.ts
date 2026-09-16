import { defineCard } from "../define.js";

export default defineCard({
  name: "March of the Multitudes",
  manaCost: "{X}{G}{W}{W}",
  colors: ["G", "W"],
  types: ["instant"],
  text: "Convoke\nCreate X 1/1 white Soldier creature tokens with lifelink.",
  convoke: true,
  effect: { kind: "create-token", token: "Lifelink Soldier Token", count: "x" },
});
