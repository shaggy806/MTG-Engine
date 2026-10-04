import { defineCard } from "../define.js";

// EDHREC rank 5680.
//
// Rulings:
//   [2022-02-18] Each face of a transforming double-faced card has its own set of characteristics:
//     name, types, subtypes, abilities, and so on. While a transforming double-faced permanent is
//     on the battlefield, consider only the characteristics of the face that's currently up. The
//     other set of characteristics is ignored.
//   [2022-02-18] Each transforming double-faced card in this set is cast face up. In every zone
//     other than the battlefield, consider only the characteristics of its front face. If it is on
//     the battlefield, consider only the characteristics of the face that's up; the other face's
//     characteristics are ignored.
//   [2022-02-18] A transforming double-faced card enters the battlefield with its front face up by
//     default, unless a spell or ability instructs you to put it onto the battlefield transformed
//     or you cast it transformed, in which case it enters with its back face up.
//   [2022-02-18] If you are instructed to put a card that isn't a double-faced card onto the
//     battlefield transformed, it will not enter the battlefield at all. In that case, it stays in
//     the zone it was previously in. For example, if a single-faced card is a copy of Azusa's Many
//     Journeys, the chapter III ability will cause it to be exiled and then remain in exile.
//   [2022-02-18] The back face of a transforming double-faced card usually has a color indicator
//     that defines its color.
//   [2022-02-18] The mana value of a transforming double-faced card is the mana value of its front
//     face, no matter which face is up.

export default defineCard({
  name: "Michiko's Reign of Truth",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  subtypes: ["Saga"],
  text: "(As this Saga enters and after your draw step, add a lore counter.)\nI, II — Target creature gets +1/+1 until end of turn for each artifact and/or enchantment you control.\nIII — Exile this Saga, then return it to the battlefield transformed under your control.",
  faces: ["Michiko's Reign of Truth", "Portrait of Michiko"],
  transform: true,
  chapters: [
    {
      at: [1, 2],
      targets: ["creature"],
      // Counted as the chapter ability resolves (rule 608.2h).
      effect: {
        kind: "modify-pt",
        target: 0,
        power: { countOf: { typesAnyOf: ["artifact", "enchantment"], controlledBy: "you" } },
        toughness: { countOf: { typesAnyOf: ["artifact", "enchantment"], controlledBy: "you" } },
        duration: "end-of-turn",
      },
      resolve: null,
      text: "I, II — Target creature gets +1/+1 until end of turn for each artifact and/or enchantment you control.",
    },
    {
      at: [3],
      targets: [],
      // Clive, Ifrit's Dominant's shape: it comes back as Portrait of
      // Michiko, a new object that's no Saga, so nothing sacrifices it.
      effect: { kind: "flicker", target: "source", transformed: true, underYourControl: true },
      resolve: null,
      text: "III — Exile this Saga, then return it to the battlefield transformed under your control.",
    },
  ],
});
