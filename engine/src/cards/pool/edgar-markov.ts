import { defineCard } from "../define.js";

// #2 in top-commanders.txt, and the card Eminence was built for: its first
// ability functions from the **command zone**, so it makes a Vampire for
// every Vampire spell you cast from the very first turn, whether or not Edgar
// is ever on the battlefield.
//
// `fromCommandZone` is on that one ability only. First strike, haste and the
// attack trigger do nothing from the command zone, which is exactly why the
// flag is per-ability rather than per-card.
const EMINENCE_TEXT =
  "Eminence — Whenever you cast another Vampire spell, if Edgar Markov is in the command " +
  "zone or on the battlefield, create a 1/1 black Vampire creature token.";
const ATTACK_TEXT =
  "Whenever Edgar Markov attacks, put a +1/+1 counter on each Vampire you control.";

export default defineCard({
  name: "Edgar Markov",
  manaCost: "{3}{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 4,
  toughness: 4,
  keywords: ["first-strike", "haste"],
  text: `${EMINENCE_TEXT}\nFirst strike, haste\n${ATTACK_TEXT}`,
  triggered: [
    {
      fromCommandZone: true,
      // `otherOnly` is load-bearing: the card on the stack is itself in the
      // trigger scan (that is how cascade sees its own cast), so without it
      // Edgar's Eminence would fire as Edgar is cast — he is a Vampire spell.
      trigger: {
        on: "cast-spell",
        who: "you",
        otherOnly: true,
        filter: { subtype: "Vampire" },
      },
      targets: [],
      effect: { kind: "create-token", token: "1/1 Vampire Token", count: 1 },
      resolve: null,
      text: EMINENCE_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { subtype: "Vampire", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
