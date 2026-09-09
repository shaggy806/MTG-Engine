import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 10a — a modal double-faced card (creature // land). Its front
 * face is a normal creature spell; its back face (Grovewatch Hollow) is a land
 * you play instead. `legalActions` offers one option per playable face; the
 * chosen face rides on `GameObject.face`.
 */
export default defineCard({
  name: "Grovewatch Elder",
  // A made-up card — borrow a real illustration (Faeburrow Elder). A direct
  // image URL is passed through as-is; see `client/src/ui/art.ts`.
  art: "https://cards.scryfall.io/art_crop/front/1/4/145dcac4-2c53-4ae9-9ede-24dc07474b01.jpg",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Druid"],
  power: 2,
  toughness: 3,
  keywords: ["vigilance"],
  text: "Vigilance",
  faces: ["Grovewatch Elder", "Grovewatch Hollow"],
});
