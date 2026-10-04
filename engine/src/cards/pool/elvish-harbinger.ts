import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2871.

const TRIGGER_TEXT =
  "When this creature enters, you may search your library for an Elf card, reveal it, then shuffle and put that card on top.";

export default defineCard({
  name: "Elvish Harbinger",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 2,
  text: `${TRIGGER_TEXT}\n{T}: Add one mana of any color.`,
  activated: [addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." })],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for an Elf card?",
        effect: {
          kind: "search-library",
          filter: { subtype: "Elf" },
          destination: "library-top",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
