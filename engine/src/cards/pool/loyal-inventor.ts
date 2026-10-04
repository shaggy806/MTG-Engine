import { defineCard } from "../define.js";

// EDHREC rank 5315.

const TRIGGER_TEXT =
  "When this creature enters, you may search your library for an artifact card, reveal it, then shuffle. Put that card into your hand if you control an Assassin. Otherwise, put that card on top of your library.";

const search = (destination: "hand" | "library-top") =>
  ({
    kind: "search-library",
    filter: { type: "artifact" },
    destination,
    reveal: true,
    min: 0,
    max: 1,
  }) as const;

export default defineCard({
  name: "Loyal Inventor",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 3,
  keywords: ["vigilance"],
  text: `Vigilance\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for an artifact card?",
        // Searching can't change whether you control an Assassin, so the
        // destination is settled before the search rather than after it.
        effect: {
          kind: "conditional",
          condition: { kind: "controls", filter: { subtype: "Assassin" }, atLeast: 1 },
          then: search("hand"),
          else: search("library-top"),
        },
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
