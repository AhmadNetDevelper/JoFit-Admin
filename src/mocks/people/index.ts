import type { Address } from "@/types";

/**
 * THE ONE LIST OF CUSTOMERS EVERY OTHER FIXTURE POINTS AT.
 *
 * Orders, rental bookings, coach bookings, enrolments, reviews and community
 * posts all carry a `customerId` into this list, which is what lets the customer
 * screen answer "what has this person done with us" by filtering each domain —
 * the same question the storefront's account area asks, from the staff side.
 *
 * Before this, each fixture typed its own names, and they disagreed: orders knew
 * six customers, the customer list knew four, and a rental booking belonged to
 * "Omar Nasser", who was a coach.
 *
 * `publicName` is how the storefront prints the person on a review ("Hussein
 * A."); it is how the website's review fixtures are matched back to a customer.
 * Names stay in whatever language the person wrote them in — real-world data is
 * never translated.
 */
export interface MockPerson {
  readonly id: string;
  readonly name: string;
  readonly publicName: string;
  readonly email: string;
  readonly phone?: string;
  readonly locale: "en" | "ar";
  readonly marketingOptIn: boolean;
  readonly favouriteSportIds: readonly string[];
  readonly city: "Amman" | "Irbid" | "Zarqa" | "Aqaba";
  readonly street?: string;
  /** Days before today the account was opened. */
  readonly joinedDaysAgo: number;
}

/* Mutable: the storefront bridge replaces its contents with the live customer
   list, including anyone who registered on the site. */
export const mockPeople: MockPerson[] = [
  { id: "cust-1", name: "Hussein Ayoub", publicName: "Hussein A.", email: "hussein@example.test", phone: "+962790000001", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-football", "sport-fitness"], city: "Amman", street: "12 Rainbow St", joinedDaysAgo: 325 },
  { id: "cust-2", name: "Noor Khalil", publicName: "Noor K.", email: "noor@example.test", phone: "+962790000002", locale: "en", marketingOptIn: false, favouriteSportIds: ["sport-running"], city: "Amman", street: "5 Abdoun Circle", joinedDaysAgo: 188 },
  { id: "cust-3", name: "Dana Rashid", publicName: "Dana R.", email: "dana@example.test", phone: "+962790000003", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-water-sports", "sport-outdoor"], city: "Aqaba", street: "Al-Nahda St 40", joinedDaysAgo: 107 },
  { id: "cust-4", name: "Yazan Mousa", publicName: "Yazan M.", email: "yazan@example.test", phone: "+962790000004", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-cycling"], city: "Amman", joinedDaysAgo: 27 },
  { id: "cust-5", name: "Layan Odeh", publicName: "Layan O.", email: "layan@example.test", phone: "+962790000005", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-tennis"], city: "Amman", street: "Mecca St 211", joinedDaysAgo: 402 },
  { id: "cust-6", name: "Omar Sabbagh", publicName: "Omar S.", email: "omar.sabbagh@example.test", phone: "+962790000006", locale: "en", marketingOptIn: false, favouriteSportIds: ["sport-basketball"], city: "Zarqa", street: "Army St 17", joinedDaysAgo: 291 },
  { id: "cust-7", name: "Samer Talhouni", publicName: "Sami T.", email: "samer@example.test", phone: "+962790000007", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-running", "sport-outdoor"], city: "Amman", joinedDaysAgo: 230 },
  { id: "cust-8", name: "Farah Saeed", publicName: "Farah S.", email: "farah@example.test", phone: "+962790000008", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-football"], city: "Amman", street: "Wasfi Al-Tal St 90", joinedDaysAgo: 140 },
  { id: "cust-9", name: "Tareq Bitar", publicName: "Tareq B.", email: "tareq.bitar@example.test", locale: "en", marketingOptIn: false, favouriteSportIds: ["sport-basketball"], city: "Amman", joinedDaysAgo: 96 },
  { id: "cust-10", name: "رزان عبيدات", publicName: "رزان ع.", email: "razan@example.test", phone: "+962790000010", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-fitness"], city: "Irbid", street: "شارع الجامعة 14", joinedDaysAgo: 210 },
  { id: "cust-11", name: "Mohammad Darwish", publicName: "Mohammad D.", email: "mohammad@example.test", phone: "+962790000011", locale: "en", marketingOptIn: false, favouriteSportIds: ["sport-football", "sport-gym"], city: "Zarqa", joinedDaysAgo: 175 },
  { id: "cust-12", name: "ليث جرادات", publicName: "ليث ج.", email: "laith@example.test", phone: "+962790000012", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-basketball"], city: "Irbid", joinedDaysAgo: 61 },
  { id: "cust-13", name: "هبة نصار", publicName: "هبة ن.", email: "heba@example.test", phone: "+962790000013", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-running"], city: "Amman", street: "شارع مكة 88", joinedDaysAgo: 150 },
  { id: "cust-14", name: "Sara Williams", publicName: "Sara W.", email: "sara@example.test", locale: "en", marketingOptIn: false, favouriteSportIds: ["sport-running", "sport-swimming"], city: "Amman", joinedDaysAgo: 44 },
  { id: "cust-15", name: "أحمد صالح", publicName: "أحمد ص.", email: "ahmad@example.test", phone: "+962790000015", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-gym"], city: "Amman", joinedDaysAgo: 260 },
  { id: "cust-16", name: "دعاء مصطفى", publicName: "دعاء م.", email: "duaa@example.test", phone: "+962790000016", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-fitness"], city: "Zarqa", joinedDaysAgo: 83 },
  { id: "cust-17", name: "زيد حداد", publicName: "زيد ح.", email: "zaid@example.test", phone: "+962790000017", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-basketball", "sport-fitness"], city: "Amman", street: "شارع الرينبو 3", joinedDaysAgo: 199 },
  { id: "cust-18", name: "نادين قاسم", publicName: "نادين ق.", email: "nadine@example.test", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-fitness"], city: "Amman", joinedDaysAgo: 72 },
  { id: "cust-19", name: "عبد الله الرفاعي", publicName: "عبد الله ر.", email: "abdullah@example.test", phone: "+962790000019", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-running"], city: "Irbid", joinedDaysAgo: 118 },
  { id: "cust-20", name: "منى طه", publicName: "منى ط.", email: "muna@example.test", phone: "+962790000020", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-swimming"], city: "Amman", joinedDaysAgo: 33 },
  { id: "cust-21", name: "باسل خليل", publicName: "باسل خ.", email: "basel.k@example.test", phone: "+962790000021", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-running", "sport-outdoor"], city: "Aqaba", joinedDaysAgo: 164 },
  { id: "cust-22", name: "Lina Hamdan", publicName: "Lina H.", email: "lina@example.test", phone: "+962790000022", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-fitness", "sport-gym"], city: "Amman", street: "Zahran St 55", joinedDaysAgo: 356 },
  { id: "cust-23", name: "Yousef Qasem", publicName: "Yousef", email: "yousef.q@example.test", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-running"], city: "Amman", joinedDaysAgo: 128 },
  { id: "cust-24", name: "Hala Amin", publicName: "Hala", email: "hala.amin@example.test", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-basketball"], city: "Irbid", joinedDaysAgo: 91 },
  { id: "cust-25", name: "Rami Haddad", publicName: "Rami", email: "rami.h@example.test", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-running", "sport-fitness"], city: "Amman", joinedDaysAgo: 240 },
  { id: "cust-26", name: "Marwan Jaber", publicName: "Marwan", email: "marwan.j@example.test", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-basketball"], city: "Zarqa", joinedDaysAgo: 57 },
  { id: "cust-27", name: "Jana Haddadin", publicName: "Jana H.", email: "jana@example.test", phone: "+962790000027", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-tennis", "sport-fitness"], city: "Amman", street: "Queen Rania St 102", joinedDaysAgo: 311 },
  { id: "cust-28", name: "خالد العمري", publicName: "خالد ع.", email: "khaled@example.test", phone: "+962790000028", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-football"], city: "Irbid", street: "شارع إيدون 7", joinedDaysAgo: 274 },
  { id: "cust-29", name: "Tala Nimri", publicName: "Tala N.", email: "tala@example.test", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-swimming", "sport-water-sports"], city: "Aqaba", joinedDaysAgo: 202 },
  { id: "cust-30", name: "سلمى الزعبي", publicName: "سلمى ز.", email: "salma@example.test", phone: "+962790000030", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-fitness"], city: "Amman", street: "شارع الجاردنز 41", joinedDaysAgo: 188 },
  { id: "cust-31", name: "Faris Qudah", publicName: "Faris Q.", email: "faris@example.test", phone: "+962790000031", locale: "en", marketingOptIn: false, favouriteSportIds: ["sport-cycling", "sport-outdoor"], city: "Amman", joinedDaysAgo: 349 },
  { id: "cust-32", name: "رنا حجازي", publicName: "رنا ح.", email: "rana@example.test", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-running"], city: "Zarqa", joinedDaysAgo: 131 },
  { id: "cust-33", name: "Adam Shami", publicName: "Adam S.", email: "adam@example.test", phone: "+962790000033", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-basketball", "sport-gym"], city: "Amman", street: "Sweifieh Main St 9", joinedDaysAgo: 222 },
  { id: "cust-34", name: "ميس الطراونة", publicName: "ميس ط.", email: "mais@example.test", phone: "+962790000034", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-fitness", "sport-gym"], city: "Amman", joinedDaysAgo: 99 },
  { id: "cust-35", name: "Karam Bataineh", publicName: "Karam B.", email: "karam@example.test", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-football"], city: "Irbid", joinedDaysAgo: 66 },
  { id: "cust-36", name: "Leen Majali", publicName: "Leen M.", email: "leen@example.test", phone: "+962790000036", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-tennis"], city: "Amman", street: "Dabouq 22", joinedDaysAgo: 157 },
  { id: "cust-37", name: "حمزة المومني", publicName: "حمزة م.", email: "hamza@example.test", phone: "+962790000037", locale: "ar", marketingOptIn: false, favouriteSportIds: ["sport-running", "sport-cycling"], city: "Zarqa", joinedDaysAgo: 248 },
  { id: "cust-38", name: "Nour Hijazi", publicName: "Nour H.", email: "nour.h@example.test", locale: "en", marketingOptIn: true, favouriteSportIds: ["sport-swimming"], city: "Amman", joinedDaysAgo: 19 },
  { id: "cust-39", name: "عمر الخطيب", publicName: "عمر خ.", email: "omar.k@example.test", phone: "+962790000039", locale: "ar", marketingOptIn: true, favouriteSportIds: ["sport-gym"], city: "Amman", street: "شارع وصفي التل 120", joinedDaysAgo: 290 },
  { id: "cust-40", name: "Maya Sweiss", publicName: "Maya S.", email: "maya@example.test", phone: "+962790000040", locale: "en", marketingOptIn: false, favouriteSportIds: ["sport-running", "sport-fitness"], city: "Amman", joinedDaysAgo: 11 },
];

export function personById(id: string): MockPerson {
  const person = mockPeople.find((entry) => entry.id === id);
  if (!person) throw new Error(`Fixture points at unknown customer "${id}"`);
  return person;
}

/** Matches a storefront display name ("Hussein A.") back to its customer. */
export function personByPublicName(name: string): MockPerson | undefined {
  return mockPeople.find((entry) => entry.publicName === name);
}

export function personAddress(person: MockPerson): Address | undefined {
  if (!person.street) return undefined;
  return {
    id: `addr-${person.id}`,
    recipientName: person.name,
    phone: person.phone ?? "",
    line1: person.street,
    city: person.city,
    countryCode: "JO",
  };
}

/** The `{ id, name, email }` reference other domains embed. */
export function personRef(id: string): { id: string; name: string; email: string } {
  const person = personById(id);
  return { id: person.id, name: person.name, email: person.email };
}
