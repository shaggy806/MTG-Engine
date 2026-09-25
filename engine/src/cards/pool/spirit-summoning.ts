import { defineCard } from "../define.js";

export default defineCard({
  name: "Spirit Summoning",
  manaCost: "{1}{R/W}{R/W}",
  colors: ["W", "R"],
  types: ["sorcery"],
  subtypes: ["Lesson"],
  text: "Create a 3/2 red and white Spirit creature token.",
  effect: { kind: "create-token", token: "Spirit Token (Red-White)", count: 1 },
});
