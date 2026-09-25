import { defineCard } from "../define.js";

export default defineCard({
  name: "Sprout",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Create a 1/1 green Saproling creature token.",
  effect: { kind: "create-token", token: "Saproling Token", count: 1 },
});
