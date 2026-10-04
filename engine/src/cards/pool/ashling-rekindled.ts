import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";

// EDHREC rank 5366.
//
// Rulings:
//   [2025-11-17] In some rare cases, this permanent might transform while its triggered ability
//     that allows you to pay mana to transform it is still on the stack. (For example, another
//     effect might cause that ability to trigger an additional time.) In such a case, even if you
//     pay mana as the triggered ability resolves, this permanent won't transform because it
//     already transformed while the triggered ability was on the stack.
//   [2025-11-17] A token that is created as a copy of a double-faced permanent or a double-faced
//     card in another zone is a double-faced token. It will have both the front face and back face
//     of whatever object it's copying. If it's copying a double-faced permanent whose back face is
//     up, the token will enter with its back face up. It can transform if instructed to do so.
//   [2025-11-17] In the Commander variant, a double-faced card's color identity is determined by
//     the mana costs and mana symbols in the rules text of both faces combined. If either face has
//     a color indicator or basic land type, those are also considered. For example, Oko, Lorwyn
//     Liege's color identity is green and blue, since its front face is blue, its rules text
//     contains a green mana symbol, and its back face has a green color indicator as well as a
//     blue mana symbol in its rules text.
//   [2025-11-17] Each face of a nonmodal double-faced card has its own set of characteristics:
//     name, types, subtypes, abilities, and so on. While a double-faced permanent is on the
//     battlefield, consider only the characteristics of the face that's currently up. The other
//     set of characteristics is ignored.
//   [2025-11-17] Each nonmodal double-faced card in this release is cast face up. In every zone
//     other than the battlefield, consider only the characteristics of its front face. If it is on
//     the battlefield, consider only the characteristics of the face that's up; the other face's
//     characteristics are ignored.
//   [2025-11-17] If you are instructed to put a card that isn't a double-faced card onto the
//     battlefield transformed, it will not enter at all.
//   [2025-11-17] The back face of a nonmodal double-faced card usually has a color indicator that
//     defines its color.
//   [2025-11-17] A nonmodal double-faced card enters with its front face up by default, unless a
//     spell or ability instructs you to put it onto the battlefield transformed or allows you to
//     cast it transformed, in which case it enters with its back face up.
//   [2025-11-17] The mana value of a nonmodal double-faced card is the mana value of its front
//     face, no matter which face is up.
//   [2025-11-17] If a spell has {X} in its mana cost, use the value chosen for that X to determine
//     the mana value of that spell.
//
// A transforming double-faced card (Brigid, Clachan's Heart's shape); the back
// face is Ashling, Rimebound. "Your first main phase" is the precombat main
// phase. "If you do, draw" — nothing is drawn when no card was discarded.
const LOOT_TEXT =
  "Whenever this creature enters or transforms into Ashling, Rekindled, you may discard a card. If you do, draw a card.";
const TRANSFORM_TEXT = "At the beginning of your first main phase, you may pay {U}. If you do, transform Ashling.";

const LOOT: EffectSpec = {
  kind: "may",
  prompt: "Discard a card to draw a card?",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "discard", target: "you", amount: 1 },
      { kind: "conditional", condition: { kind: "this-way", what: "discarded" }, then: { kind: "draw", amount: 1 } },
    ],
  },
};

export default defineCard({
  name: "Ashling, Rekindled",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Sorcerer"],
  power: 1,
  toughness: 3,
  text: `${LOOT_TEXT}\n${TRANSFORM_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: LOOT,
      resolve: null,
      text: LOOT_TEXT,
    },
    {
      trigger: { on: "transforms", who: "self", intoFront: true },
      targets: [],
      effect: LOOT,
      resolve: null,
      text: LOOT_TEXT,
    },
    {
      // Won't transform her if she has transformed since it triggered (the
      // ruling; rule 701.28f).
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {U} to transform Ashling?",
        cost: "{U}",
        effect: { kind: "transform", target: "source" },
      },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Ashling, Rekindled", "Ashling, Rimebound"],
  transform: true,
});
