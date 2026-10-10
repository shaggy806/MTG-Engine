import { defineCard } from "../define.js";
import { atLevel, classLevel } from "../helpers.js";

// EDHREC rank 4622. A Class (rule 716): each level bar is a sorcery-speed
// activated ability from the level below, and the abilities under it are
// gated on the level (`atLevel`).
export default defineCard({
  name: "Stormchaser's Talent",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Class"],
  text: "(Gain the next level as a sorcery to add its ability.)\nWhen this Class enters, create a 1/1 blue and red Otter creature token with prowess.\n{3}{U}: Level 2\nWhen this Class becomes level 2, return target instant or sorcery card from your graveyard to your hand.\n{5}{U}: Level 3\nWhenever you cast an instant or sorcery spell, create a 1/1 blue and red Otter creature token with prowess.",
  triggered: [
    { trigger: { on: "enters-battlefield", who: "self" }, targets: [], effect: { kind: "create-token", token: "Otter Token", count: 1 }, resolve: null, text: "When this Class enters, create a 1/1 blue and red Otter creature token with prowess." },
    atLevel(2, { trigger: { on: "class-level-gained", who: "self", level: 2 }, targets: [{ kind: "card-in-graveyard", whose: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }], effect: { kind: "return-to-hand", target: 0, from: "graveyard" }, resolve: null, text: "When this Class becomes level 2, return target instant or sorcery card from your graveyard to your hand." }),
    atLevel(3, { trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } }, targets: [], effect: { kind: "create-token", token: "Otter Token", count: 1 }, resolve: null, text: "Whenever you cast an instant or sorcery spell, create a 1/1 blue and red Otter creature token with prowess." }),
  ],
  activated: [
    classLevel(2, "{3}{U}"),
    classLevel(3, "{5}{U}"),
  ],
});
