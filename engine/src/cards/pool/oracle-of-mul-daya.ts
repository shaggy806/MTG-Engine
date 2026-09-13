import { defineCard } from "../define.js";

/** Drops "You may play lands from the top of your library" — a distinct
 * permission from `playFromGraveyard` (graveyard-only) that the engine has
 * no equivalent for yet; only the reveal (`revealsOwnLibraryTop`) and the
 * extra land drop are modeled. */
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
    "Play with the top card of your library revealed.",
  revealsOwnLibraryTop: true,
  static: [
    {
      affects: { scope: "self" },
      extraLandsPerTurn: 1,
      text: "You may play an additional land on each of your turns.",
    },
  ],
});
