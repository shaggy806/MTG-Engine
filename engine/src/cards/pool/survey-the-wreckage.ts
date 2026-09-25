import { defineCard } from "../define.js";

export default defineCard({
  name: "Survey the Wreckage",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Destroy target land. Create a 1/1 red Goblin creature token.",
  targets: ["land"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "create-token", token: "Goblin Token", count: 1 }],
  },
});
