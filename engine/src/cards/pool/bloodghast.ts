import { defineCard } from "../define.js";

const BLOCK_TEXT = "This creature can't block.";
const HASTE_TEXT = "This creature has haste as long as an opponent has 10 or less life.";
const LANDFALL_TEXT =
  "Landfall — Whenever a land you control enters, you may return this card from your graveyard to the battlefield.";

// The landfall ability returns this card from the graveyard, so it works only
// there (rule 113.6k): it triggers only if Bloodghast is already in your
// graveyard as the land enters (the ruling).
export default defineCard({
  name: "Bloodghast",
  manaCost: "{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Spirit"],
  power: 2,
  toughness: 1,
  text: `${BLOCK_TEXT}\n${HASTE_TEXT}\n${LANDFALL_TEXT}`,
  static: [
    { affects: { scope: "self" }, restrictions: ["cant-block"], text: BLOCK_TEXT },
    {
      affects: { scope: "self" },
      condition: { kind: "life-total", who: "opponent", atMost: 10 },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
  triggered: [
    {
      fromGraveyard: true,
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Return Bloodghast from your graveyard to the battlefield?",
        effect: { kind: "put-onto-battlefield", target: "source" },
      },
      resolve: null,
      text: LANDFALL_TEXT,
    },
  ],
});
