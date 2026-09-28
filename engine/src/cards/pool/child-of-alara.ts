import { defineCard } from "../define.js";

// #227 in top-commanders.txt. As a commander it dies before its owner is
// offered the command zone (rule 903.9a, a state-based action), so its
// trigger happens whichever zone they pick.
const DIES_TEXT =
  "When Child of Alara dies, destroy all nonland permanents. They can't be regenerated.";

export default defineCard({
  name: "Child of Alara",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: `Trample\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "destroy-all", filter: { notTypes: ["land"] }, cantBeRegenerated: true },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
