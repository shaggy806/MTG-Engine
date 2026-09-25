import { defineCard } from "../define.js";

// #430 in top-commanders.txt.
//
// "If it's the first combat phase of the turn" is the intervening-if, which
// is what stops the extra combat's attack from adding another.
const TEXT =
  "Whenever you attack, if it's the first combat phase of the turn, untap all attacking creatures. " +
  "They gain first strike until end of turn. After this phase, there is an additional combat phase.";
const attackers = { type: "creature", controlledBy: "you", attacking: true } as const;

export default defineCard({
  name: "Karlach, Fury of Avernus",
  manaCost: "{4}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Tiefling", "Barbarian"],
  power: 5,
  toughness: 4,
  pairing: { kind: "choose-a-background" },
  text: `${TEXT}\nChoose a Background (You can have a Background as a second commander.)`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      condition: { kind: "turn-structure", combatPhase: 1 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap-all", filter: attackers },
          { kind: "grant-keyword-all", filter: attackers, keyword: "first-strike", duration: "end-of-turn" },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
