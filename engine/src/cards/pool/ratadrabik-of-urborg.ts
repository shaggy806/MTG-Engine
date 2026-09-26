import { ward } from "../helpers.js";
import { defineCard } from "../define.js";

// #487 in top-commanders.txt.
//
// "A copy of that creature" copies it as it last existed on the battlefield
// (rule 608.2h): a Clone that died as a copy of a legend makes a copy of that
// legend, and a legendary token that ceased to exist is still copied. The
// exceptions are part of the copy's copiable values (rule 707.9b).
const ZOMBIE_TEXT = "Other Zombies you control have vigilance.";
const DIES_TEXT =
  "Whenever another legendary creature you control dies, create a token that's a copy of that creature, except " +
  "it's not legendary and it's a 2/2 black Zombie in addition to its other colors and types.";

export default defineCard({
  name: "Ratadrabik of Urborg",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance"],
  text: `Vigilance, ward {2}\n${ZOMBIE_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Zombie", controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["vigilance"],
      text: ZOMBIE_TEXT,
    },
  ],
  triggered: [
    ward({ mana: "{2}" }),
    {
      trigger: {
        on: "dies",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature", supertype: "legendary" },
      },
      targets: [],
      effect: {
        kind: "create-token-copy",
        of: "trigger-object",
        count: 1,
        who: "you",
        notLegendary: true,
        exceptions: { basePt: [2, 2], addColors: ["B"], addSubtypes: ["Zombie"] },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
