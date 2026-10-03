import { defineCard } from "../define.js";

// It enters unattached, whatever the Equipment it copies is attached to (its
// ruling); declining, it's an Equipment with no equip ability.
export default defineCard({
  name: "Masterwork of Ingenuity",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: "You may have this Equipment enter as a copy of any Equipment on the battlefield.",
  copyOnEnter: { filter: { subtype: "Equipment" } },
});
