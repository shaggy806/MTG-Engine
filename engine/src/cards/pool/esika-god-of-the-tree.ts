import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// #39 in top-commanders.txt. A modal DFC; the back face is The Prismatic
// Bridge, which is also what makes her five-colour.
const MANA_TEXT = "{T}: Add one mana of any color.";
const GRANT_TEXT = `Other legendary creatures you control have vigilance and "${MANA_TEXT}"`;

export default defineCard({
  name: "Esika, God of the Tree",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 1,
  toughness: 4,
  keywords: ["vigilance"],
  text: `Vigilance\n${MANA_TEXT}\n${GRANT_TEXT}`,
  activated: [addManaAbility({ mana: "any-color", text: MANA_TEXT })],
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
        excludeSelf: true,
      },
      grantKeywords: ["vigilance"],
      grantsActivated: [addManaAbility({ mana: "any-color", text: MANA_TEXT })],
      text: GRANT_TEXT,
    },
  ],
  faces: ["Esika, God of the Tree", "The Prismatic Bridge"],
});
