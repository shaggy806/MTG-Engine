import { roomCard } from "../helpers.js";
import left from "./restricted-office.js";
import right from "./lecture-hall.js";

// EDHREC rank 5282. A Room (rule 709.5): each door is cast on its own and
// enters unlocked; the other is unlocked by paying its mana cost as a
// sorcery.
export default roomCard("Restricted Office // Lecture Hall", left, right);
