import { defineCard } from "../define.js";

// - "Play lands from your graveyard" reaches a modal double-faced card's land
//   face, but not a nonland face (2020-09-25 ruling): the permission is
//   matched against the face being played.
// - The doubling is Panharmonicon's `doubleTriggers` shape, keyed on a land
//   entering. "Whenever you play a land" is a different event, and isn't
//   doubled (ruling).
const GRAVEYARD_TEXT = "You may play lands from your graveyard.";
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
  text: `Reach\n${GRAVEYARD_TEXT}\n${DOUBLE_TEXT}`,
  static: [
    { affects: { scope: "self" }, playFromGraveyard: { type: "land" }, text: GRAVEYARD_TEXT },
    { affects: { scope: "self" }, doubleTriggers: { cause: "enters", filter: { type: "land" } }, text: DOUBLE_TEXT },
  ],
});
