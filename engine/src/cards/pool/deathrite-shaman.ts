import { defineCard } from "../define.js";

const LAND_TEXT = "{T}: Exile target land card from a graveyard. Add one mana of any color.";
const SPELL_TEXT = "{B}, {T}: Exile target instant or sorcery card from a graveyard. Each opponent loses 2 life.";
const CREATURE_TEXT = "{G}, {T}: Exile target creature card from a graveyard. You gain 2 life.";

// The first ability targets, so it isn't a mana ability (rule 605.5a — the
// ruling): it uses the stack, and its colour is chosen as it resolves. An
// illegal target by then and nothing happens, mana included (the ruling).
export default defineCard({
  name: "Deathrite Shaman",
  manaCost: "{B/G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 1,
  toughness: 2,
  text: `${LAND_TEXT} (Activate only as an instant.)\n${SPELL_TEXT}\n${CREATURE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "card-in-graveyard", filter: { type: "land" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          { kind: "add-mana", mana: "any-color", amount: 1 },
        ],
      },
      resolve: null,
      text: LAND_TEXT,
    },
    {
      cost: { mana: "{B}", tap: true },
      targets: [{ kind: "card-in-graveyard", filter: { typesAnyOf: ["instant", "sorcery"] } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          { kind: "lose-life", amount: 2, who: "each-opponent" },
        ],
      },
      resolve: null,
      text: SPELL_TEXT,
    },
    {
      cost: { mana: "{G}", tap: true },
      targets: [{ kind: "card-in-graveyard", filter: { type: "creature" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile", target: 0 },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: CREATURE_TEXT,
    },
  ],
});
