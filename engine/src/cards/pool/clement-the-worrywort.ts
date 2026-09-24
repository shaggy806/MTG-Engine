import { defineCard } from "../define.js";

// #333 in top-commanders.txt.
//
// - "with lesser mana value" is lesser than the *entering* creature's — a
//   target filter whose number is read off the trigger object
//   (`{ amount: { manaValueOf: "trigger-object" } }`, a `DynamicOperand`).
//   It is read again when the target is rechecked on resolution, so a
//   creature that no longer qualifies by then isn't returned (rule 608.2b).
//   A creature is never lesser than itself, so the one that entered can't be
//   returned by its own trigger.
// - "Clement or another creature you control" is every creature you control
//   entering, Clement included — Scourge of Valkas's shape.
// - The Frog grant is Cryptolith Rite's `grantsActivated` over Frogs, with
//   Ancient Ziggurat's creature-spell restriction on the mana. Clement is a
//   Frog, so it has the ability itself.
const MANA_TEXT = "{T}: Add {G} or {U}. Spend this mana only to cast a creature spell.";
const TRIGGER_TEXT =
  "Whenever Clement, the Worrywort or another creature you control enters, " +
  "return up to one target creature you control with lesser mana value to its owner's hand.";
const GRANT_TEXT = `Frogs you control have "${MANA_TEXT}"`;

export default defineCard({
  name: "Clement, the Worrywort",
  manaCost: "{1}{G}{U}",
  colors: ["G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Frog", "Druid"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: `Vigilance\n${TRIGGER_TEXT}\n${GRANT_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
      targets: [
        {
          kind: "optional",
          of: {
            kind: "permanent",
            whose: "you",
            filter: {
              type: "creature",
              manaValue: { op: "lt", n: { amount: { manaValueOf: "trigger-object" } } },
            },
          },
        },
      ],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Frog" },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [],
          effect: {
            kind: "add-mana",
            mana: { oneOf: ["G", "U"] },
            amount: 1,
            spendOnly: {
              spell: { type: "creature" },
              text: "Spend this mana only to cast a creature spell.",
            },
          },
          resolve: null,
          text: MANA_TEXT,
        },
      ],
      text: GRANT_TEXT,
    },
  ],
});
