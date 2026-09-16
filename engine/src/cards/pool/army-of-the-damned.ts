import { defineCard } from "../define.js";

export default defineCard({
  name: "Army of the Damned",
  manaCost: "{5}{B}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Create thirteen tapped 2/2 black Zombie creature tokens.\n" +
    "Flashback {7}{B}{B}{B}",
  effect: { kind: "create-token", token: "Zombie Token", count: 13, tapped: true },
  flashback: { cost: "{7}{B}{B}{B}" },
});
