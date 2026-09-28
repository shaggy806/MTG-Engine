import { defineCard } from "../define.js";
import { mobilize } from "../helpers.js";

// Sacrificed as a cost, so it's gone before the count is taken: "the number
// of creatures you control" as the ability resolves doesn't include it. It
// deals the damage as it last existed (rule 608.2h).
const MOBILIZE_TEXT =
  "Mobilize 1 (Whenever this creature attacks, create a tapped and attacking 1/1 red Warrior creature token. Sacrifice it at the beginning of the next end step.)";
const ACTIVATED_TEXT =
  "{1}{R}, Sacrifice this creature: It deals damage equal to the number of creatures you control to target creature.";

export default defineCard({
  name: "Stadium Headliner",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  text: `${MOBILIZE_TEXT}\n${ACTIVATED_TEXT}`,
  triggered: [mobilize(1)],
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "damage", target: 0, amount: { countOf: { type: "creature", controlledBy: "you" } } },
      resolve: null,
      text: ACTIVATED_TEXT,
    },
  ],
});
