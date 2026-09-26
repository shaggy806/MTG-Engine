import { defineCard } from "../define.js";

// An X/X blue and red Elemental with flying and haste — Rootha, Mastering the
// Moment's token. Its X is set by the effect that makes it (`create-token`'s
// `basePt`); printed, it's 0/0.
export default defineCard({
  name: "X/X Elemental Token (Flying, Haste)",
  art: "fe42cba4-e00f-4e34-8e26-99721727dced",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 0,
  toughness: 0,
  keywords: ["flying", "haste"],
  text: "Flying, haste",
});
