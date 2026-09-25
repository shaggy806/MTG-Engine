import { defineCard } from "../define.js";

export default defineCard({
  name: "Spore Swarm",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Create three 1/1 green Saproling creature tokens.",
  effect: { kind: "create-token", token: "Saproling Token", count: 3 },
});
