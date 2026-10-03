import { defineCard } from "../define.js";

const DEVOTION_TEXT =
  "{2}, {T}: Choose a color. Add an amount of mana of that color equal to your devotion to that color. " +
  "(Your devotion to a color is the number of mana symbols of that color in the mana costs of permanents you control.)";

// A mana ability (the ruling): the colour is chosen as it's activated, then
// the devotion to it counted, Nykthos itself included while it's there.
export default defineCard({
  name: "Nykthos, Shrine to Nyx",
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {C}.\n${DEVOTION_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: { devotionTo: "that-color" } },
      resolve: null,
      text: DEVOTION_TEXT,
    },
  ],
});
