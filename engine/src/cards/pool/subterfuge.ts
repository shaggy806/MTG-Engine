import { defineCard } from "../define.js";

// EDHREC rank 6085.
//
// Rulings:
//   [2025-11-17] Opponents who have left the game aren't counted when determining how many tokens
//     to create.
//   [2025-11-17] Exiling the card with encore is a cost to activate the encore ability.
//   [2025-11-17] The tokens copy only what's on the original card. Effects that modified that
//     creature when it was previously on the battlefield won't be copied.
//   [2025-11-17] Each token must attack the appropriate player if able.
//
// The granted trigger is Hunter's Prowess's; encore is Mist Dancer's shape.
const ENTER_TEXT =
  'When this creature enters, target creature gains flying and "Whenever this creature deals combat damage to a player, draw that many cards" until end of turn.';

export default defineCard({
  name: "Subterfuge",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Elemental", "Incarnation"],
  power: 3,
  toughness: 5,
  text: `${ENTER_TEXT}\nEncore {7}{U}{U} ({7}{U}{U}, Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able. They gain haste. Sacrifice them at the beginning of the next end step. Activate only as a sorcery.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
          {
            kind: "grant-triggered",
            target: 0,
            duration: "end-of-turn",
            ability: {
              trigger: { on: "deals-combat-damage-to-player", who: "self" },
              targets: [],
              effect: { kind: "draw", amount: { triggerValue: true } },
              resolve: null,
              text: "Whenever this creature deals combat damage to a player, draw that many cards.",
            },
          },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{7}{U}{U}", tap: false },
      zone: "graveyard",
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "encore" },
      resolve: null,
      text: "Encore {7}{U}{U} — Exile this card from your graveyard: For each opponent, create a token copy that attacks that opponent this turn if able.",
    },
  ],
});
