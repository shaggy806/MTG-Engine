import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 2073. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`). The last level's "if mana from a Treasure was spent" is Mastermind Plum's `manaFrom`.
export default defineCard({
  name: "Alchemist's Talent",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nWhen this Class enters, create two tapped Treasure tokens.\n{1}{R}: Level 2\nTreasures you control have \"{T}, Sacrifice this artifact: Add two mana of any one color.\"\n{4}{R}: Level 3\nWhenever you cast a spell, if mana from a Treasure was spent to cast it, this Class deals damage equal to that spell's mana value to each opponent.",
  static: [
    atLevel(2, { affects: { scope: "filter", filter: { subtype: "Treasure", controlledBy: "you" } }, grantsActivated: [{ cost: { mana: null, tap: true, sacrifice: "self" }, targets: [], effect: { kind: "add-mana", mana: { oneOf: ["W", "U", "B", "R", "G"], same: true }, amount: 2 }, resolve: null, text: "{T}, Sacrifice this artifact: Add two mana of any one color." }], text: "Treasures you control have \"{T}, Sacrifice this artifact: Add two mana of any one color.\"" }),
  ],
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: { kind: "create-token", token: "Treasure Token", count: 2, tapped: true }, resolve: null, text: "When this Class enters, create two tapped Treasure tokens." },
    atLevel(3, { trigger: { on: "cast-spell", who: "you", filter: { manaFrom: { subtype: "Treasure" } } }, targets: [], effect: { kind: "damage", amount: { manaValueOf: "trigger-object" }, who: "each-opponent" }, resolve: null, text: "Whenever you cast a spell, if mana from a Treasure was spent to cast it, this Class deals damage equal to that spell's mana value to each opponent." }),
  ],
  activated: [
    classLevel(2, "{1}{R}"),
    classLevel(3, "{4}{R}"),
  ],
});
