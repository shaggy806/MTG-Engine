import { defineCard } from "../define.js";

// EDHREC rank 4995.
export default defineCard({
  name: "Filter Out",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return all noncreature, nonland permanents to their owners' hands.",
  effect: { kind: "return-to-hand-all", filter: { notTypes: ["creature", "land"] } },
});
