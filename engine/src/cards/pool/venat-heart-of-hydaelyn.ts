import { defineCard } from "../define.js";

// EDHREC rank 2870.
//
// Rulings:
//   [2025-06-06] The mana value of a nonmodal double-faced card is the mana value of its front
//     face, no matter which face is up.
//   [2025-06-06] Each nonmodal double-faced card in this release is cast face up. In every zone
//     other than the battlefield, consider only the characteristics of its front face. If it is on
//     the battlefield, consider only the characteristics of the face that's up; the other face's
//     characteristics are ignored.
//   [2025-06-06] A nonmodal double-faced card enters with its front face up by default, unless a
//     spell or ability instructs you to put it onto the battlefield transformed or allows you to
//     cast it transformed, in which case it enters with its back face up.
//   [2025-06-06] Each face of a nonmodal double-faced card has its own set of characteristics:
//     name, types, subtypes, abilities, and so on. While a nonmodal double-faced permanent is on
//     the battlefield, consider only the characteristics of the face that's currently up. The
//     other set of characteristics is ignored.
//   [2025-06-06] If you are instructed to put a card that isn't a double-faced card onto the
//     battlefield transformed, it will not enter at all. In that case, it stays in the zone it was
//     previously in. For example, if a single-faced card is a copy of Crystal Fragments, it will
//     be exiled during the resolution of its second ability and remain in exile.
//   [2025-06-06] In the Commander variant, a double-faced card's color identity is determined by
//     the mana costs and mana symbols in the rules text of both faces combined. If either face has
//     a color indicator or basic land type, those are also considered. For example, Cecil, Dark
//     Knight's color identity is black and white, since its front face is black and its back face
//     has a white color indicator.
//   [2025-06-06] If the target creature is an illegal target as Hydaelyn, the Mothercrystal's last
//     ability tries to resolve, it won't resolve and none of its effects will happen. You won't
//     draw a card even if that creature is legendary.
//   [2025-06-06] A token that is created as a copy of a double-faced permanent or a double-faced
//     card in another zone is a double-faced token. It will have both the front face and back face
//     of whatever object it's copying. If it's copying a double-faced permanent whose back face is
//     up, the token will enter with its back face up. It can transform if instructed to do so.
//   [2025-06-06] The back face of a nonmodal double-faced card usually has a color indicator that
//     defines its color.

export default defineCard({
  name: "Venat, Heart of Hydaelyn",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Wizard"],
  power: 3,
  toughness: 3,
  text: "Whenever you cast a legendary spell, draw a card. This ability triggers only once each turn.\nHero's Sundering — {7}, {T}: Exile target nonland permanent. Transform Venat. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{7}", tap: true },
      targets: ["nonland-permanent"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          { kind: "transform", target: "source" },
        ],
      },
      resolve: null,
      text: "Hero's Sundering — {7}, {T}: Exile target nonland permanent. Transform Venat. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { supertype: "legendary" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever you cast a legendary spell, draw a card. This ability triggers only once each turn.",
      oncePerTurn: true,
    },
  ],
  faces: ["Venat, Heart of Hydaelyn", "Hydaelyn, the Mothercrystal"],
  transform: true,
});
