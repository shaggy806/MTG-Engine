import { defineCard } from "../define.js";

// Draconic Destruction.
//
// - The +1 makes him a legendary 4/4 red Dragon creature and nothing else
//   until end of turn (`animate`'s `setTypes`, rule 205.1a): not a
//   planeswalker, so damage to him is marked and takes no loyalty, and the
//   loyalty counters he had stay on him (its ruling). He was already on the
//   battlefield — nothing "enters" (its ruling) — and a copy of him that
//   enters is a Sarkhan planeswalker with four loyalty (the animation isn't
//   copiable).
// - The −6's emblem has two triggered abilities (rule 114.4).
const PLUS =
  "+1: Until end of turn, Sarkhan becomes a legendary 4/4 red Dragon creature with flying, indestructible, and haste. (He doesn't lose loyalty while he's not a planeswalker.)";
const MINUS = "−3: Sarkhan deals 4 damage to target creature.";
const DRAW = "At the beginning of your draw step, draw two additional cards";
const DISCARD = "At the beginning of your end step, discard your hand.";
const ULTIMATE = `−6: You get an emblem with "${DRAW}" and "${DISCARD}"`;

export default defineCard({
  name: "Sarkhan, the Dragonspeaker",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Sarkhan"],
  loyalty: 4,
  text: `${PLUS}\n${MINUS}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "animate",
        target: "source",
        power: 4,
        toughness: 4,
        setTypes: ["creature"],
        addTypes: [],
        addSubtypes: ["Dragon"],
        setColors: ["R"],
        keywords: ["flying", "indestructible", "haste"],
        duration: "end-of-turn",
      },
      resolve: null,
      text: PLUS,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: { kind: "damage", amount: 4, target: 0 },
      resolve: null,
      text: MINUS,
    },
    {
      loyaltyCost: -6,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: `${DRAW}. ${DISCARD}`,
        triggered: [
          {
            trigger: { on: "step-begins", step: "draw", who: "you" },
            targets: [],
            effect: { kind: "draw", amount: 2 },
            resolve: null,
            text: `${DRAW}.`,
          },
          {
            trigger: { on: "step-begins", step: "end", who: "you" },
            targets: [],
            effect: { kind: "discard-hand", who: "you" },
            resolve: null,
            text: DISCARD,
          },
        ],
      },
      resolve: null,
      text: ULTIMATE,
    },
  ],
});
