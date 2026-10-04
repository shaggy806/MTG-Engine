import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 4864.
//
// Rulings:
//   [2023-04-14] You choose whether or not to cast the instant or sorcery card as the triggered
//     ability resolves. If you do, you do so as part of the resolution of that ability. You can't
//     wait to cast it later in the turn. Timing restrictions based on the card's type are ignored.
//   [2023-04-14] If the card has {X} in its mana cost, you must choose 0 as the value of X when
//     casting it without paying its mana cost.
//   [2023-04-14] The card you cast may be one you just put into the graveyard with surveil or one
//     already in the graveyard.
//
// The static is Sword of Light and Shadow's; the trigger's cast is Diviner of
// Mist's (`cast-now` from the graveyard, chosen as it resolves, after the
// surveil is answered).

const STATIC_TEXT = "Equipped creature gets +2/+2 and has protection from blue and from black.";
const DAMAGE_TEXT =
  "Whenever equipped creature deals combat damage to a player, surveil 2. Then you may cast an instant or sorcery spell with mana value 2 or less from your graveyard without paying its mana cost. If that spell would be put into your graveyard, exile it instead.";

export default defineCard({
  name: "Sword of Once and Future",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\n${DAMAGE_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPt: [2, 2],
      protection: { colors: ["U", "B"] },
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "attached" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "surveil", amount: 2 },
          {
            kind: "cast-now",
            from: "graveyard",
            free: true,
            spell: { typesAnyOf: ["instant", "sorcery"], manaValue: { op: "lte", n: 2 } },
            exileAfter: true,
          },
        ],
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
