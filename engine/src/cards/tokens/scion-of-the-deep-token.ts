import { defineCard } from "../define.js";

// Kiora, the Rising Tide's token: Scion of the Deep, a legendary 8/8 blue
// Octopus. A *named legendary* token (like Phobos), so the legend rule
// (704.5j) applies to a second one.

export default defineCard({
  name: "Scion of the Deep",
  art: "26c478f7-b426-4055-8d06-e5782226c826",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Octopus"],
  power: 8,
  toughness: 8,
});
