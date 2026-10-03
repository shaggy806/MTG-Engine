import { defineCard } from "../define.js";

const DEVOTION_TEXT =
  "{T}: Choose a color. Add an amount of mana of that color equal to your devotion to that color. " +
  "(Your devotion to a color is the number of mana symbols of that color in the mana costs of permanents you control.)";

// A mana ability (the ruling): the colour is chosen as it's tapped, then the
// devotion to it counted as it resolves.
export default defineCard({
  name: "Nyx Lotus",
  manaCost: "{4}",
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `Nyx Lotus enters tapped.\n${DEVOTION_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: { devotionTo: "that-color" } },
      resolve: null,
      text: DEVOTION_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "Nyx Lotus enters tapped.",
    },
  ],
});
