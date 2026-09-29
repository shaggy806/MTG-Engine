import { defineCard } from "../define.js";

const ETB_TEXT = "When Titania enters, return target land card from your graveyard to the battlefield.";
const TOKEN_TEXT =
  "Whenever a land you control is put into a graveyard from the battlefield, create a 5/3 green Elemental creature token.";

// "Put into a graveyard from the battlefield" is dying (rule 700.4), for a
// land as for a creature, and is seen as it left — a land token too, and
// lands leaving along with Titania herself (rule 603.10a).
export default defineCard({
  name: "Titania, Protector of Argoth",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 5,
  toughness: 3,
  text: `${ETB_TEXT}\n${TOKEN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "land" } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "create-token", token: "5/3 Green Elemental Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
});
