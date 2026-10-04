import { defineCard } from "../define.js";

// EDHREC rank 3900.

const TEXT = "Whenever a player casts a spell, they lose 1 life for each spell they've cast this turn.";

export default defineCard({
  name: "Rug of Smothering",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      // "They" is the caster (`trigger-controller` — the spell's controller),
      // and the count is theirs, read as the trigger resolves: every spell
      // they've cast this turn, this one included (Aetherflux Reservoir's
      // `spells-cast` stat).
      trigger: { on: "cast-spell", who: "any" },
      targets: [],
      effect: {
        kind: "lose-life",
        who: "trigger-controller",
        amount: { turnStat: "spells-cast", who: "trigger-controller" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
