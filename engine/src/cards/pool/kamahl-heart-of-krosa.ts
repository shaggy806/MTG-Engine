import { defineCard } from "../define.js";

// EDHREC rank 5211.
//
// Rulings:
//   [2020-11-10] To have two commanders, both must have the partner ability as the game begins.
//     Losing the ability during the game doesn't cause either to cease to be your commander.
//   [2020-11-10] If your Commander deck has two commanders, you can only include cards whose own
//     color identities are also found in your commanders' combined color identities. If Falthis
//     and Kediss are your commanders, your deck may contain cards with black and/or red in their
//     color identity, but not cards with green, white, or blue.
//   [2020-11-10] A land that becomes a creature because of Kamahl's activated ability will retain
//     any other supertypes, card types, subtypes, and abilities it had.
//   [2020-11-10] You can choose two commanders with partner that are the same color or colors. In
//     Commander Draft, you can even choose two of the same commander with partner if you drafted
//     them. If you do this, make sure you keep the number of times you've cast each from the
//     command zone clear for "commander tax" purposes.
//   [2020-11-10] If something refers to your commander while you have two commanders, it refers to
//     one of them of your choice. If you are instructed to perform an action on your commander
//     (e.g. put it from the command zone into your hand due to Command Beacon), you choose one of
//     your commanders at the time the effect happens.
//   [2020-11-10] An effect that checks whether you control your commander is satisfied if you
//     control one or both of your two commanders.
//   [2020-11-10] Only creatures you control at the time Kamahl's triggered ability resolves will
//     get +3/+3 and gain trample. Creatures that come under your control later in the turn and
//     noncreature permanents that become creatures later in the turn won't get the bonuses.
//   [2020-11-10] Once the game begins, your two commanders are tracked separately. If you cast
//     one, you won't have to pay an additional {2} the first time you cast the other. A player
//     loses the game after having been dealt 21 damage from any one of them, not from both of them
//     combined.
//   [2020-11-10] Both commanders start in the command zone, and the remaining 98 cards (or 58
//     cards in a Commander Draft game) of your deck are shuffled to become your library.

export default defineCard({
  name: "Kamahl, Heart of Krosa",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Druid"],
  power: 5,
  toughness: 5,
  pairing: { kind: "partner" },
  text: "At the beginning of combat on your turn, creatures you control get +3/+3 and gain trample until end of turn.\n{1}{G}: Until end of turn, target land you control becomes a 1/1 Elemental creature with vigilance, indestructible, and haste. It's still a land.\nPartner (You can have two commanders if both have partner.)",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false },
      targets: ["land-you-control"],
      // Llanowar Loamspeaker's shape: types added, not set (it keeps its other
      // types and abilities — the ruling), and no colour named.
      effect: {
        kind: "animate",
        target: 0,
        power: 1,
        toughness: 1,
        addTypes: ["creature"],
        addSubtypes: ["Elemental"],
        keywords: ["vigilance", "indestructible", "haste"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: "{1}{G}: Until end of turn, target land you control becomes a 1/1 Elemental creature with vigilance, indestructible, and haste. It's still a land.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      // Overrun's shape: only creatures you control as it resolves (the ruling).
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "modify-pt-all",
            filter: { type: "creature", controlledBy: "you" },
            power: 3,
            toughness: 3,
            duration: "end-of-turn",
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "trample",
            duration: "end-of-turn",
          },
        ],
      },
      resolve: null,
      text: "At the beginning of combat on your turn, creatures you control get +3/+3 and gain trample until end of turn.",
    },
  ],
});
