import { defineCard } from "../define.js";

export default defineCard({
  name: "Sculpting Steel",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "You may have this artifact enter as a copy of any artifact on the battlefield.",
  copyOnEnter: { filter: { type: "artifact" } },
});
