import { defineCard } from "../define.js";

// EDHREC rank 3279.
//
// Rulings:
//   [2020-08-07] Unlike many effects that grant additional combat phases, you don't get an
//     additional main phase with Godo, Bandit Warlord's ability. The additional combat phase
//     happens immediately after the first combat phase.

const ENTER_TEXT =
  "When Godo enters, you may search your library for an Equipment card, put it onto the battlefield, then shuffle.";
const ATTACK_TEXT =
  "Whenever Godo attacks for the first time each turn, untap it and all Samurai you control. After this phase, there is an additional combat phase.";

export default defineCard({
  name: "Godo, Bandit Warlord",
  manaCost: "{5}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Barbarian"],
  power: 3,
  toughness: 3,
  text: `${ENTER_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { subtype: "Equipment" },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      // Scourge of the Throne's shape. "The first time each turn" is the
      // first combat it's declared an attacker in, so the extra combat it
      // adds doesn't fire it again; no additional main phase (the ruling).
      trigger: { on: "attacks", who: "self", firstTimeEachTurn: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "untap", target: "source" },
          { kind: "untap-all", filter: { subtype: "Samurai", controlledBy: "you" } },
          { kind: "additional-combat", afterThisPhase: true },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
