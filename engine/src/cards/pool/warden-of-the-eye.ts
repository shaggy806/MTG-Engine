import { defineCard } from "../define.js";

export default defineCard({
  name: "Warden of the Eye",
  manaCost: "{2}{U}{R}{W}",
  colors: ["W", "U", "R"],
  types: ["creature"],
  subtypes: ["Djinn", "Wizard"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, return target noncreature, nonland card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["creature", "land"] } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target noncreature, nonland card from your graveyard to your hand.",
    },
  ],
});
