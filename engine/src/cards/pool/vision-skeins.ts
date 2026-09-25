import { defineCard } from "../define.js";

export default defineCard({
  name: "Vision Skeins",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Each player draws two cards.",
  effect: { kind: "draw", amount: 2, who: "each-player" },
});
