import { defineCard } from "../define.js";

// #135 in top-commanders.txt.
//
// "Do this only once each turn" is the `may`'s `oncePerTurn`: every token
// still triggers it, but once the counters have gone on this turn it isn't
// offered again (a declined one doesn't use it up).
const TOKEN_TEXT =
  "Whenever a token you control enters, you may put a +1/+1 counter on each creature you control. " +
  "Do this only once each turn.";
const PUMP_TEXT = "{W}{U}{B}{R}{G}: Creatures you control gain menace, trample, and lifelink until end of turn.";
const yours = { type: "creature", controlledBy: "you" } as const;

export default defineCard({
  name: "Leonardo, the Balance",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Ninja", "Turtle"],
  power: 3,
  toughness: 3,
  pairing: { kind: "partner-group", group: "Character select" },
  text:
    `${TOKEN_TEXT}\n${PUMP_TEXT}\n` +
    "Partner—Character select (You can have two commanders if both have this ability.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { token: true } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a +1/+1 counter on each creature you control?",
        oncePerTurn: true,
        effect: { kind: "add-counter-all", filter: yours, counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{W}{U}{B}{R}{G}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword-all", filter: yours, keyword: "menace", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: yours, keyword: "trample", duration: "end-of-turn" },
          { kind: "grant-keyword-all", filter: yours, keyword: "lifelink", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
