import { defineCard } from "../define.js";

export default defineCard({
  name: "Seedborn Muse",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 4,
  text: "Untap all permanents you control during each other player's untap step.",
  static: [
    {
      affects: { scope: "self" },
      untapsDuringOthersUntap: {},
      text: "Untap all permanents you control during each other player's untap step.",
    },
  ],
});
