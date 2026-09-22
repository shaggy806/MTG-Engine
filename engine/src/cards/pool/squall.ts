import { defineCard } from "../define.js";

// #350 in top-commanders.txt.
//
// "Rough Divide" is an ability word (rule 207.2c) — no rules meaning, so it
// lives in `text` only, never in `keywords`, the same way the pool's Landfall
// cards spell theirs.
const DIVIDE_TEXT =
  "Rough Divide — Whenever a creature you control attacks alone, it gains double strike until end of turn.";
const SABOTEUR_TEXT =
  "Whenever Squall deals combat damage to a player, return target permanent card with mana value 3 or less from your graveyard to the battlefield.";

export default defineCard({
  name: "Squall, SeeD Mercenary",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight", "Mercenary"],
  power: 3,
  toughness: 4,
  text: `${DIVIDE_TEXT}\n${SABOTEUR_TEXT}`,
  triggered: [
    {
      // The lone attacker is never a target — "it" is the creature the
      // `attacked-alone` event names, read via `"trigger-object"` (the same
      // shape Exalted uses on Ignoble Hierarch). `who: "you-control"` is the
      // printed "a creature you control", which includes Squall itself.
      trigger: { on: "attacks-alone", who: "you-control" },
      targets: [],
      effect: {
        kind: "grant-keyword",
        target: "trigger-object",
        keyword: "double-strike",
        duration: "end-of-turn",
      },
      resolve: null,
      text: DIVIDE_TEXT,
    },
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [
        {
          // "permanent card" is every card type but instant and sorcery
          // (rule 110.4a) — the `notTypes` spelling the pool already uses for
          // Genesis Ultimatum and The Ur-Dragon. A required slot, not an
          // optional one: the printed ability has no "you may".
          kind: "card-in-graveyard",
          whose: "you",
          filter: { notTypes: ["instant", "sorcery"], manaValue: { op: "lte", n: 3 } },
        },
      ],
      // No `underYourControl`: the card comes out of *your* graveyard, so its
      // owner is already you, and the printed text names no controller.
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: SABOTEUR_TEXT,
    },
  ],
});
