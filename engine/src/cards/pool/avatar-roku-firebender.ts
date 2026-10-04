import { defineCard } from "../define.js";

// EDHREC rank 4850.

// "Whenever a player attacks" fires once per declaration of one or more
// attackers, whoever's turn it is (`attack-with`, `who: "any"`). The mana is
// Roku's controller's, kept until end of combat (firebending's
// `untilEndOfCombat`).
const ATTACK_TEXT = "Whenever a player attacks, add six {R}. Until end of combat, you don't lose this mana as steps end.";
const PUMP_TEXT = "{R}{R}{R}: Target creature gets +3/+0 until end of turn.";

export default defineCard({
  name: "Avatar Roku, Firebender",
  manaCost: "{3}{R}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Avatar"],
  power: 6,
  toughness: 6,
  text: `${ATTACK_TEXT}\n${PUMP_TEXT}`,
  triggered: [
    {
      trigger: { on: "attack-with", who: "any", atLeast: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 6, untilEndOfCombat: true },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{R}{R}{R}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 3, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: PUMP_TEXT,
    },
  ],
});
