import { defineCard } from "../define.js";

// EDHREC rank 3341.
//
// Rulings:
//   [2023-07-28] If the colorless spell has {X} in its mana cost, use the value chosen for X when
//     calculating that spell's mana value.
//   [2023-07-28] Skittering Cicada's second ability applies only to casting spells. It does not,
//     for example, change when you may activate abilities that can be activated "only as a
//     sorcery."
//   [2023-07-28] Skittering Cicada's last ability resolves before the spell that caused it to
//     trigger. It resolves even if that spell is countered.

const FLASH_TEXT = "You may cast colorless spells as though they had flash.";
const CAST_TEXT =
  "Whenever you cast a colorless spell, until end of turn, this creature gains trample and gets +X/+X, where X is that spell's mana value.";

// X is read off the trigger object — as it last was on the stack if it has
// already left (countered), with its chosen {X} counted.
const X = { manaValueOf: "trigger-object" } as const;

export default defineCard({
  name: "Skittering Cicada",
  manaCost: "{3}",
  colors: [],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 2,
  toughness: 2,
  keywords: ["flash"],
  text: `Flash\n${FLASH_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: { colorless: true },
      text: FLASH_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { colorless: true } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: "source", keyword: "trample", duration: "end-of-turn" },
          { kind: "modify-pt", target: "source", power: X, toughness: X, duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
