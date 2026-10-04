import { defineCard } from "../define.js";

// EDHREC rank 3953.
//
// Rulings:
//   [2018-07-13] Any cards not cast, including land cards, remain in exile.
//   [2018-07-13] Apex of Power doesn't change when you can cast the exiled cards. For example, if
//     you exile a sorcery card, you can cast it only during your main phase when the stack is
//     empty.
//   [2018-07-13] If an effect copies Apex of Power, the copy wasn't cast at all, so you won't add
//     ten mana.
//   [2018-07-13] Casting an exiled card causes it to leave exile. You can't cast it multiple
//     times.
//
// "Cast spells from among them" is `castOnly` (a land stays exiled). "If
// this spell was cast from your hand" is Approach of the Second Sun's
// `source` `castFrom: "hand"` condition. "Ten mana of any one color" as a
// spell resolves is a choice of colour spelled out as a modal over the five
// (Seasonal Ritual's shape), ten of the one picked.
const TEXT =
  "Exile the top seven cards of your library. Until end of turn, you may cast spells from among them.\nIf this spell was cast from your hand, add ten mana of any one color.";

export default defineCard({
  name: "Apex of Power",
  manaCost: "{7}{R}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "impulse-exile", amount: 7, duration: "end-of-turn", castOnly: true },
      {
        kind: "conditional",
        condition: { kind: "source", filter: { castFrom: "hand" } },
        then: {
          kind: "modal",
          minModes: 1,
          maxModes: 1,
          modes: [
            { text: "Add ten {W}.", effect: { kind: "add-mana", mana: "W", amount: 10 } },
            { text: "Add ten {U}.", effect: { kind: "add-mana", mana: "U", amount: 10 } },
            { text: "Add ten {B}.", effect: { kind: "add-mana", mana: "B", amount: 10 } },
            { text: "Add ten {R}.", effect: { kind: "add-mana", mana: "R", amount: 10 } },
            { text: "Add ten {G}.", effect: { kind: "add-mana", mana: "G", amount: 10 } },
          ],
        },
      },
    ],
  },
});
