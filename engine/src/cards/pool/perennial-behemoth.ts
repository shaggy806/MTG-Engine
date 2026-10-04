import { defineCard } from "../define.js";
import { unearth } from "../helpers.js";

// Rulings: it doesn't allow activating abilities (such as cycling) of land
// cards in your graveyard, and doesn't change when lands may be played — one
// per turn, main phase, empty stack (the `playFromGraveyard` permission, as
// Crucible of Worlds).

export default defineCard({
  name: "Perennial Behemoth",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 7,
  text: "You may play lands from your graveyard.\nUnearth {G}{G} ({G}{G}: Return this card from your graveyard to the battlefield. It gains haste. Exile it at the beginning of the next end step or if it would leave the battlefield. Unearth only as a sorcery.)",
  static: [
    {
      affects: { scope: "self" },
      playFromGraveyard: { type: "land" },
      text: "You may play lands from your graveyard.",
    },
  ],
  activated: [unearth("{G}{G}")],
});
