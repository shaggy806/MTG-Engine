import { defineCard } from "../define.js";

// EDHREC rank 5500.
//
// Rulings:
//   [2025-06-06] The cost reduction applies only to generic mana in the total cost of legendary
//     creature spells you cast.
//   [2025-06-06] Serah Farron's last ability checks at the moment it would trigger to see if you
//     control two or more other legendary creatures. If you don't, the ability won't trigger at
//     all. If it does trigger, the ability will check again as it tries to resolve. If you don't
//     control two or more other legendary creatures at that time, the ability won't resolve and
//     none of its effects will happen.
//   [2025-06-06] The mana value of a nonmodal double-faced card is the mana value of its front
//     face, no matter which face is up.
//   [2025-06-06] A nonmodal double-faced card enters with its front face up by default, unless a
//     spell or ability instructs you to put it onto the battlefield transformed or allows you to
//     cast it transformed, in which case it enters with its back face up.
//   [2025-06-06] In the Commander variant, a double-faced card's color identity is determined by
//     the mana costs and mana symbols in the rules text of both faces combined. If either face has
//     a color indicator or basic land type, those are also considered. For example, Cecil, Dark
//     Knight's color identity is black and white, since its front face is black and its back face
//     has a white color indicator.
//   [2025-06-06] Each face of a nonmodal double-faced card has its own set of characteristics:
//     name, types, subtypes, abilities, and so on. While a nonmodal double-faced permanent is on
//     the battlefield, consider only the characteristics of the face that's currently up. The
//     other set of characteristics is ignored.
//   [2025-06-06] Each nonmodal double-faced card in this release is cast face up. In every zone
//     other than the battlefield, consider only the characteristics of its front face. If it is on
//     the battlefield, consider only the characteristics of the face that's up; the other face's
//     characteristics are ignored.
//   [2025-06-06] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying (such as a flashback cost), add any cost increases (such as kicker
//     costs), then apply any cost reductions (such as that of Serah Farron or Crystallized Serah's
//     first abilities). The mana value of the spell is determined by only its mana cost, no matter
//     what the total cost to cast that spell was.
//   [2025-06-06] The back face of a nonmodal double-faced card usually has a color indicator that
//     defines its color.
//   [2025-06-06] If you are instructed to put a card that isn't a double-faced card onto the
//     battlefield transformed, it will not enter at all. In that case, it stays in the zone it was
//     previously in. For example, if a single-faced card is a copy of Crystal Fragments, it will
//     be exiled during the resolution of its second ability and remain in exile.
//   [2025-06-06] A token that is created as a copy of a double-faced permanent or a double-faced
//     card in another zone is a double-faced token. It will have both the front face and back face
//     of whatever object it's copying. If it's copying a double-faced permanent whose back face is
//     up, the token will enter with its back face up. It can transform if instructed to do so.

const COST_TEXT = "The first legendary creature spell you cast each turn costs {2} less to cast.";
const TRANSFORM_TEXT =
  "At the beginning of combat on your turn, if you control two or more other legendary creatures, you may transform Serah Farron.";

// Conduit of Ruin's first-each-turn reduction, narrowed to legendary creature
// spells (a legendary creature spell cast earlier this turn was the first).
// The intervening-if leaves Serah out (`excludeSelf`) and is checked as it
// triggers and again as it resolves (the ruling).
export default defineCard({
  name: "Serah Farron",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Citizen"],
  power: 2,
  toughness: 2,
  text: `${COST_TEXT}\n${TRANSFORM_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", supertype: "legendary" },
        caster: "you",
        reduceGeneric: 2,
        firstEachTurn: true,
      },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      condition: {
        kind: "controls",
        filter: { type: "creature", supertype: "legendary" },
        atLeast: 2,
        excludeSelf: true,
      },
      targets: [],
      effect: { kind: "may", prompt: "Transform Serah Farron?", effect: { kind: "transform", target: "source" } },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Serah Farron", "Crystallized Serah"],
  transform: true,
});
