import { defineCard } from "../define.js";

const PLAY_TEXT = "You may play lands from your graveyard.";
const DOUBLE_TEXT =
  "If a land entering causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.";

export default defineCard({
  name: "Ancient Greenwarden",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 7,
  keywords: ["reach"],
  text: `Reach (This creature can block creatures with flying.)\n${PLAY_TEXT}\n${DOUBLE_TEXT}`,
  static: [
    // Still the one land drop, at sorcery timing (ruling).
    { affects: { scope: "self" }, playFromGraveyard: { type: "land" }, text: PLAY_TEXT },
    { affects: { scope: "self" }, doubleTriggers: { cause: "enters", filter: { type: "land" } }, text: DOUBLE_TEXT },
  ],
});
