import { defineCard } from "../define.js";

// #105 in top-commanders.txt. Its Eminence is Edgar Markov's shape on an
// attack instead of a cast: `fromCommandZone` lets the looting trigger work
// while Sidar Jabari waits in the command zone, and the intervening-if is the
// real "if Sidar Jabari is in the command zone or on the battlefield" —
// `sameObject`, because the card's ruling is explicit that a Sidar Jabari
// that changed zones after the trigger (dying and going to the command zone,
// say) is a new object, and the loot does nothing.
//
// "Attack with one or more Knights" is one trigger per declaration, however
// many Knights, so it's `attack-with` at least one rather than a per-attacker
// `attacks`. Sidar Jabari is a Knight himself.
const EMINENCE_TEXT =
  "Eminence — Whenever you attack with one or more Knights, if Sidar Jabari is in the " +
  "command zone or on the battlefield, draw a card, then discard a card.";
const DAMAGE_TEXT =
  "Whenever Sidar Jabari deals combat damage to a player, return target Knight creature " +
  "card from your graveyard to the battlefield.";

export default defineCard({
  name: "Sidar Jabari of Zhalfir",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 4,
  toughness: 3,
  keywords: ["flying", "first-strike"],
  text: `${EMINENCE_TEXT}\nFlying, first strike\n${DAMAGE_TEXT}`,
  triggered: [
    {
      fromCommandZone: true,
      condition: { kind: "source-zone", zones: ["command", "battlefield"], sameObject: true },
      trigger: { on: "attack-with", who: "you", atLeast: 1, filter: { subtype: "Knight" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "discard", target: "you", amount: 1 },
        ],
      },
      resolve: null,
      text: EMINENCE_TEXT,
    },
    {
      // The damaged player is only handed to slot 0 when that slot can hold a
      // player, which a graveyard card slot can't — so the controller picks
      // the Knight. Not optional: with no Knight card in the graveyard the
      // trigger has no legal target and is removed (rule 603.3d).
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { type: "creature", subtype: "Knight" },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
