import { defineCard } from "../define.js";

// It triggers once per declaration in which you attack with it, your
// commander, or both (`thisOrYourCommander`); your commander is the one you
// own (rule 903.3). The Goblins come for each opponent, attacked or not, each
// attacking that player only — not a planeswalker they control (rule 508.4).
const ATTACK_TEXT =
  "Whenever you attack with this creature and/or your commander, for each opponent, create a 1/1 red Goblin creature token that's tapped and attacking that player.";
const SACRIFICE_TEXT = "Sacrifice this creature: Creature tokens you control gain indestructible until end of turn.";

export default defineCard({
  name: "Ainok Strike Leader",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${ATTACK_TEXT}\n${SACRIFICE_TEXT}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1, thisOrYourCommander: true },
      targets: [],
      effect: {
        kind: "for-each-player",
        who: "each-opponent",
        effect: {
          kind: "create-token",
          token: "Goblin Token",
          count: 1,
          tapped: true,
          attacking: { player: "that-player" },
        },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "grant-keyword-all",
        filter: { type: "creature", token: true, controlledBy: "you" },
        keyword: "indestructible",
        duration: "end-of-turn",
      },
      resolve: null,
      text: SACRIFICE_TEXT,
    },
  ],
});
