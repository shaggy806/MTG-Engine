import { defineCard } from "../define.js";

export default defineCard({
  name: "Oracle of Mul Daya",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 2,
  toughness: 2,
  text:
    "You may play an additional land on each of your turns.\n" +
    "Play with the top card of your library revealed.\n" +
    "You may play lands from the top of your library.",
  revealsOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      text: "You may play an additional land on each of your turns.",
    },
    {
      affects: { scope: "self" },
      playFromLibraryTop: { type: "land" },
      text: "You may play lands from the top of your library.",
    },
  ],
});
