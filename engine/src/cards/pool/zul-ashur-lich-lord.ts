import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 2629.
//
// Rulings:
//   [2024-11-08] You pay all costs and follow all normal timing rules for Zombie creature cards
//     cast with the permission granted by Zul Ashur's last ability.

const WARD_TEXT =
  "Ward—Pay 2 life. (Whenever this creature becomes the target of a spell or ability an opponent controls, counter it unless that player pays 2 life.)";
const CAST_TEXT = "{T}: You may cast target Zombie creature card from your graveyard this turn.";

export default defineCard({
  name: "Zul Ashur, Lich Lord",
  manaCost: "{1}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Warlock"],
  power: 2,
  toughness: 2,
  text: `${WARD_TEXT}\n${CAST_TEXT}`,
  triggered: [ward({ payLife: 2 })],
  activated: [
    {
      // Emry's shape: a permission on the card, for its ordinary costs and
      // timing (the ruling), until end of turn or until it leaves the graveyard.
      cost: { mana: null, tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature", subtype: "Zombie" } }],
      effect: { kind: "grant-graveyard-cast", target: 0 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
