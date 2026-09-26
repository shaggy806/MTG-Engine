import { defineCard } from "../define.js";

// #452 in top-commanders.txt.
//
// The enchantment's base P/T is its mana value as the ability resolves
// (rule 608.2h), and it stays that however the mana value might read later.
// It lasts indefinitely, as the ability gives no duration.
const GRANT_TEXT = "Enchantment creatures you control have deathtouch, lifelink, and hexproof.";
const ANIMATE_TEXT =
  "{1}{W}: Target non-Aura enchantment you control becomes a creature in addition to its other types and has " +
  "base power and base toughness each equal to its mana value.";

export default defineCard({
  name: "Zur, Eternal Schemer",
  manaCost: "{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${GRANT_TEXT}\n${ANIMATE_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["enchantment", "creature"], controlledBy: "you" } },
      grantKeywords: ["deathtouch", "lifelink", "hexproof"],
      text: GRANT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "enchantment", notSubtypes: ["Aura"] } }],
      effect: {
        kind: "animate",
        target: 0,
        power: { manaValueOf: 0 },
        toughness: { manaValueOf: 0 },
        addTypes: ["creature"],
        addSubtypes: [],
        duration: "permanent",
      },
      resolve: null,
      text: ANIMATE_TEXT,
    },
  ],
});
