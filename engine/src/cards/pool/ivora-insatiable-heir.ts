import { defineCard } from "../define.js";

// EDHREC rank 5872.
//
// "When Ivora enters and whenever it deals combat damage to a player" is two
// triggers with one effect. "Whenever you discard a card" fires once per card.

const BLOOD_TEXT =
  "When Ivora enters and whenever it deals combat damage to a player, create a Blood token. (It's an artifact with \"{1}, {T}, Discard a card, Sacrifice this token: Draw a card.\")";
const DISCARD_TEXT = "Whenever you discard a card, put a +1/+1 counter on Ivora.";

export default defineCard({
  name: "Ivora, Insatiable Heir",
  manaCost: "{1}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["trample"],
  text: `Trample\n${BLOOD_TEXT}\n${DISCARD_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Blood Token", count: 1 },
      resolve: null,
      text: BLOOD_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Blood Token", count: 1 },
      resolve: null,
      text: BLOOD_TEXT,
    },
    {
      trigger: { on: "discards", who: "you", perCard: true },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: DISCARD_TEXT,
    },
  ],
});
