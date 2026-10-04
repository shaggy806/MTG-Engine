import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// EDHREC rank 5451.
//
// Rulings (the partner ones are the deck validator's):
//   [2020-11-10] For spells with {X} in their mana costs, use the value chosen for X to determine
//     the spell's mana value.
//   [2020-11-10] An ability that triggers when a player casts a spell resolves before the spell
//     that caused it to trigger. It resolves even if that spell is countered.

const TEXT =
  "When Brinelin enters and whenever you cast a spell with mana value 6 or greater, you may return target nonland permanent to its owner's hand.";

// One printed ability with two trigger events — two triggered abilities that
// do the same thing. A spell's mana value on the stack counts its X.
const BOUNCE: EffectSpec = {
  kind: "may",
  prompt: "Return target nonland permanent to its owner's hand?",
  effect: { kind: "return-to-hand", target: 0 },
};

export default defineCard({
  name: "Brinelin, the Moon Kraken",
  manaCost: "{6}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 6,
  toughness: 8,
  pairing: { kind: "partner" },
  text: `${TEXT}\nPartner (You can have two commanders if both have partner.)`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["nonland-permanent"],
      effect: BOUNCE,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { manaValue: { op: "gte", n: 6 } } },
      targets: ["nonland-permanent"],
      effect: BOUNCE,
      resolve: null,
      text: TEXT,
    },
  ],
});
