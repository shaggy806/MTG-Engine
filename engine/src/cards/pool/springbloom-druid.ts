import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, you may sacrifice a land. If you do, search your library for up to two basic " +
  "land cards, put them onto the battlefield tapped, then shuffle.";

// "If you do" is whether a land was sacrificed this way — with none to
// sacrifice, saying yes finds nothing.
export default defineCard({
  name: "Springbloom Druid",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Sacrifice a land to search for two basic lands?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "sacrifice", who: "you", filter: { type: "land" }, count: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "sacrificed", atLeast: 1 },
              then: {
                kind: "search-library",
                filter: { type: "land", supertype: "basic" },
                destination: "battlefield",
                min: 0,
                max: 2,
                enterTapped: true,
              },
            },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
