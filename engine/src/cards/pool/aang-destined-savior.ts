import { defineCard } from "../define.js";

// The back face of Aang, at the Crossroads.
const VIGILANCE_TEXT = "Land creatures you control have vigilance.";
const EARTHBEND_TEXT =
  "At the beginning of combat on your turn, earthbend 2. (Target land you control becomes a 0/0 " +
  "creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, " +
  "return it to the battlefield tapped.)";

export default defineCard({
  name: "Aang, Destined Savior",
  art: "https://cards.scryfall.io/art_crop/back/f/e/fea89ca0-8070-4f28-9851-994314f9d248.jpg",
  colors: [],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Avatar", "Ally"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${VIGILANCE_TEXT}\n${EARTHBEND_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["land", "creature"], controlledBy: "you" } },
      grantKeywords: ["vigilance"],
      text: VIGILANCE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: 2 },
      resolve: null,
      text: EARTHBEND_TEXT,
    },
  ],
  faces: ["Aang, at the Crossroads", "Aang, Destined Savior"],
  transform: true,
});
