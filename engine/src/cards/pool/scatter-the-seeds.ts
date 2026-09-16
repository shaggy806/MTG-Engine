import { defineCard } from "../define.js";

export default defineCard({
  name: "Scatter the Seeds",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Convoke\nCreate three 1/1 green Saproling creature tokens.",
  convoke: true,
  effect: { kind: "create-token", token: "Saproling Token", count: 3 },
});
