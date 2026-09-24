import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// "This spell can't be countered" is about Wilson being cast (rule 701.5f);
// it does nothing for a spell that targets Wilson, which ward still counters.
// "Ward {2}" is the `ward` helper's triggered ability (rule 702.21a), and
// "Choose a Background" is `pairing`, as for Ganax, Astral Hunter.
export default defineCard({
  name: "Wilson, Refined Grizzly",
  manaCost: "{1}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bear", "Warrior"],
  power: 2,
  toughness: 2,
  cantBeCountered: true,
  pairing: { kind: "choose-a-background" },
  keywords: ["reach", "vigilance", "trample"],
  text:
    "This spell can't be countered.\n" +
    "Reach, vigilance, trample\n" +
    "Ward {2} (Whenever this creature becomes the target of a spell or ability an opponent " +
    "controls, counter it unless that player pays {2}.)\n" +
    "Choose a Background (You can have a Background as a second commander.)",
  triggered: [ward({ mana: "{2}" })],
});
