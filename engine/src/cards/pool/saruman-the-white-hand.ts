import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const AMASS_TEXT =
  "Whenever you cast a noncreature spell, amass Orcs X, where X is that spell's mana value. (Put X +1/+1 " +
  "counters on an Army you control. It's also an Orc. If you don't control an Army, create a 0/0 black Orc " +
  "Army creature token first.)";
const WARD_TEXT = "Goblins and Orcs you control have ward {2}.";

// X is the spell's mana value as it was cast (read off the trigger object,
// as it last was on the stack if it has resolved). With two or more Army
// creatures, the controller chooses which gets the counters (rule 701.47a).
// The Orc Army amass makes is an Orc, so it has ward {2} too.
export default defineCard({
  name: "Saruman, the White Hand",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar", "Wizard"],
  power: 2,
  toughness: 5,
  text: `${AMASS_TEXT}\n${WARD_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "amass", amount: { manaValueOf: "trigger-object" }, creatureType: "Orc" },
      resolve: null,
      text: AMASS_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { subtypes: ["Goblin", "Orc"], controlledBy: "you" } },
      grantsTriggered: [ward({ mana: "{2}" })],
      text: WARD_TEXT,
    },
  ],
});
