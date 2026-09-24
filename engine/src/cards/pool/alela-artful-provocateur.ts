import { defineCard } from "../define.js";

// The anthem is scoped by keyword, and `staticAffects` answers that against
// the creature's *current* keywords — a creature that only flies because of
// an Aura or an anthem gets the +1/+0 too. `excludeSelf` is the "Other".
const ANTHEM_TEXT = "Other creatures you control with flying get +1/+0.";
const CAST_TEXT =
  "Whenever you cast an artifact or enchantment spell, create a 1/1 blue Faerie creature token with flying.";

export default defineCard({
  name: "Alela, Artful Provocateur",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Faerie", "Warlock"],
  power: 2,
  toughness: 3,
  keywords: ["flying", "deathtouch", "lifelink"],
  text: `Flying, deathtouch, lifelink\n${ANTHEM_TEXT}\n${CAST_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control", withKeyword: "flying", excludeSelf: true },
      grantPt: [1, 0],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["artifact", "enchantment"] } },
      targets: [],
      effect: { kind: "create-token", token: "Faerie Token", count: 1 },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
