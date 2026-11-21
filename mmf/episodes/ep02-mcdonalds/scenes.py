# Money Machine Files — Ep 2: How McDonald's Really Makes Money
# Each scene: narration text + visual spec

SCENES = [
 # ---------- COLD OPEN ----------
 dict(v=("title", "$139 BILLION", "spent at McDonald's restaurants in 2025"),
      t="In 2025, customers around the world spent about one hundred and thirty-nine billion dollars at McDonald's restaurants. Burgers, fries, shakes, and an ocean of coffee."),
 dict(v=("quote", "So why does McDonald's earn more from rent than from royalties?", ""),
      t="But only a small slice of that money ever reaches McDonald's the company. And when you look at what does arrive, something odd shows up. McDonald's earns far more from rent than from royalties. So is this really a burger company at all?"),
 dict(v=("brand", "FILE #002  ·  McDONALD'S"),
      t="This is the money machine behind McDonald's. Let's open the file."),

 # ---------- CH 1 ----------
 dict(v=("chapter", "1", "Two Brothers and a Grill"),
      t="Chapter one. Two brothers and a grill."),
 dict(v=("timeline", "1940", "McDonald's Bar-B-Q opens in San Bernardino"),
      t="In 1940, two brothers, Dick and Mac McDonald, opened a drive-in restaurant in San Bernardino, California. It was called McDonald's Bar-B-Q. It had a big menu, slow-cooked barbecue, and car hops who carried food out to customers sitting in their cars."),
 dict(v=("timeline", "1948", "Closed for 3 months, reopened with 9 items"),
      t="Business was fine, but the brothers noticed something. Most of their money came from just a few simple items. So in 1948 they did something bold. They closed the restaurant for three months and rebuilt it from the ground up."),
 dict(v=("list", "The Speedee Service System", ["Menu cut down to nine items", "15-cent hamburger", "Kitchen run like an assembly line", "No car hops: customers walk up"]),
      t="When it reopened, the menu had shrunk to just nine items, led by a fifteen-cent hamburger. The car hops were gone. The kitchen worked like a factory line, with each worker doing one job, again and again. They called it the Speedee Service System. Food came out in seconds, prices dropped, and the crowds grew."),
 dict(v=("stat", "15¢", "the 1948 hamburger", "Fewer items → faster kitchen → lower price → more customers"),
      t="This is the first gear of the machine. A small menu makes the kitchen fast. A fast kitchen makes food cheap. And cheap food brings in huge numbers of people."),

 # ---------- CH 2 ----------
 dict(v=("chapter", "2", "The Milkshake Salesman"),
      t="Chapter two. The milkshake salesman."),
 dict(v=("timeline", "1954", "Ray Kroc visits to see 8 Multimixers"),
      t="In 1954, a travelling salesman named Ray Kroc came to San Bernardino. He sold Multimixer milkshake machines, and he wanted to know why one little burger stand needed eight of them. When he saw the queues, he understood. The brothers wanted someone to franchise their system across the country, and the fifty-two-year-old Kroc took the job."),
 dict(v=("timeline", "1955", "Kroc opens his first restaurant in Des Plaines"),
      t="In April 1955, Kroc opened his first McDonald's in Des Plaines, Illinois. According to the company, first day sales were three hundred and sixty-six dollars and twelve cents."),
 dict(v=("list", "Kroc's rules for franchisees", ["Same menu, same taste everywhere", "Strict standards for speed & cleanliness", "One restaurant at a time, owner on site", "Training: Hamburger University (1961)"]),
      t="Kroc's big idea was sameness. A burger in one town had to taste exactly like a burger in another. He pushed strict rules on quality, service and cleanliness, and in 1961 the company even opened a training school in a restaurant basement, called Hamburger University."),
 dict(v=("timeline", "1961", "Kroc buys out the brothers for $2.7 million"),
      t="That same year, Kroc bought the whole business from the McDonald brothers for two point seven million dollars. Some family members later claimed there was also a handshake deal to keep paying the brothers a one percent royalty. There is no written proof of it, and it was never paid."),

 dict(v=("timeline", "1968", "A franchisee's Big Mac goes national"),
      t="Some of the best ideas did not even come from head office. A franchisee in Pittsburgh, Jim Delligatti, created a double-decker burger called the Big Mac, and in 1968 it was added to the national menu. Franchisees were not just paying customers of the system. They were helping to build it, while carrying the risk of their own restaurants."),

 # ---------- CH 3 ----------
 dict(v=("chapter", "3", "The Landlord Secret"),
      t="Chapter three. The landlord secret. This is where the real money machine is hidden."),
 dict(v=("quote", "Royalties on cheap burgers were too small to build an empire on.", ""),
      t="In the early years, franchising did not make Kroc rich. The fees he collected were only a thin slice of each cheap burger sold. Then a finance man named Harry Sonneborn, who had worked at the ice cream chain Tastee-Freez, came up with a different plan."),
 dict(v=("flow", "The Sonneborn model", ["Land", "McDonald's", "Franchisee", "Customers"], ["buys", "rents", "sells"],
         "Burgers pay the franchisee  →  the franchisee pays McDonald's rent + royalties", "McD"),
      t="Instead of just selling franchises, McDonald's would control the property. The company buys the land and the building, or signs a long lease on them. Then it rents that site to the franchisee, usually for twenty years, with rent tied to the restaurant's sales. The deals were run through a company called Franchise Realty."),
 dict(v=("list", "Why owning the property works", ["Steady rent, even in slow years", "Rent rises as sales grow", "Property value grows over decades", "A franchisee who breaks rules can lose the site"]),
      t="Think about what that gives McDonald's. Rent comes in every month. Much of it rises as the restaurant sells more. The land underneath often gains value over the years. And because McDonald's controls the building, it has enormous power to make sure every franchisee follows the rules."),
 dict(v=("quote", "Franchisees come and go. The land stays.", ""),
      t="Here is the clever part. A franchise contract can end. An owner can retire, sell up, or be replaced. But the land and the building stay with McDonald's, on the same busy corner, ready for the next operator. The burger business rents the location. McDonald's keeps it."),
 dict(v=("bars", "Franchise revenue, FY2025", [("Rent", 10442, "$10.4 bn"), ("Royalties", 6018, "$6.0 bn"), ("Initial fees", 88, "$0.09 bn")]),
      t="Look at the latest numbers. In 2025, McDonald's collected about sixteen and a half billion dollars from its franchised restaurants. Ten point four billion of that was rent. Royalties were about six billion. And the one-time fees new franchisees pay were less than a hundred million."),
 dict(v=("stat", "$22.8 BILLION", "of property under franchise deals", "Net value at end of 2025, including $7.1 bn of land"),
      t="Behind that rent is a huge pile of property. At the end of 2025, the buildings, land and equipment McDonald's has under franchise deals were worth about twenty-two point eight billion dollars on its books, after depreciation. More than seven billion of that is land."),

 # ---------- CH 4 ----------
 dict(v=("chapter", "4", "Selling Burgers vs Owning Buildings"),
      t="Chapter four. Selling burgers versus owning buildings."),
 dict(v=("pie", "95%", "of McDonald's 45,356 restaurants are franchised"),
      t="At the end of 2025, there were forty-five thousand three hundred and fifty-six McDonald's restaurants in more than one hundred countries. About ninety-five percent of them are run by independent franchisees, not by the company."),
 dict(v=("bars", "McDonald's revenue, FY2025", [("From franchisees", 16548, "$16.5 bn"), ("Own restaurants", 9690, "$9.7 bn"), ("Other", 647, "$0.6 bn")]),
      t="So where does McDonald's own revenue come from? In 2025, total revenue was about twenty-six point nine billion dollars. Sixteen and a half billion came from franchisees. Nine point seven billion came from the restaurants the company runs itself. The rest came from other sources."),
 dict(v=("compare", "FRANCHISED", ["Revenue: $16.5 bn", "Occupancy cost: $2.6 bn", "Margin: about $13.9 bn", "≈84% kept as margin"],
         "COMPANY-OPERATED", ["Sales: $9.7 bn", "Food, staff & costs: $8.3 bn", "Margin: about $1.4 bn", "≈15% kept as margin"]),
      t="Now the key comparison. From its franchise revenue, McDonald's paid about two point six billion in property costs and kept around thirteen point nine billion as margin. From its own restaurants, it took in nine point seven billion, but after food, wages and running costs, only about one point four billion was left. Franchising is almost ten times more profitable."),
 dict(v=("stat", "46%", "operating margin in 2025", "$12.4 bn operating income on $26.9 bn revenue"),
      t="That is why McDonald's has margins most restaurant companies can only dream of. In 2025, its operating income was about twelve point four billion dollars, a margin of roughly forty-six percent. Net income was about eight and a half billion."),

 # ---------- CH 5 ----------
 dict(v=("chapter", "5", "The Franchisee's Side"),
      t="Chapter five. The franchisee's side of the deal."),
 dict(v=("list", "A franchisee pays (Canada)", ["$45,000 one-time fee for 20 years", "Royalty: 4–5% of monthly sales", "Rent: base and/or % of sales", "Down payment: 40% of a new store"]),
      t="So what does it cost to run one? McDonald's Canada lists a forty-five thousand dollar fee for a twenty-year term. On top of that, a royalty of four to five percent of monthly sales, plus rent that can be a fixed base amount, a percentage of sales, or both. For a new restaurant, the owner must put down forty percent of the cost in cash, not borrowed money."),
 dict(v=("flow", "Where a customer's dollar goes", ["You", "Franchisee", "McDonald's", "Shareholders"], ["pays", "fees", "profit"],
         "The franchisee pays for staff, food and equipment out of what is left", "McD"),
      t="The franchisee pays for the staff, the food, the kitchen equipment and the daily running of the restaurant. Out of every dollar you spend, a share goes up the chain to McDonald's as rent and royalties, whether that particular restaurant had a great year or a hard one."),
 dict(v=("stat", "$31.5 BILLION", "of future minimum rent", "Already locked in by franchise contracts, end of 2025"),
      t="And because the contracts are so long, a lot of this money is already locked in. At the end of 2025, McDonald's listed about thirty-one and a half billion dollars of future minimum rent still due under its franchise agreements. That is a very predictable income stream."),

 # ---------- CH 6 ----------
 dict(v=("chapter", "6", "The App in Your Pocket"),
      t="Chapter six. The app in your pocket."),
 dict(v=("stat", "210 MILLION", "active loyalty users", "90-day active users, end of 2025"),
      t="The newest gear of the machine is digital. By the end of 2025, McDonald's had nearly two hundred and ten million people using its loyalty program in a ninety-day period, up nineteen percent in a year."),
 dict(v=("stat", "$37 BILLION", "spent by loyalty members in 2025", "Up 20% across 70 loyalty markets"),
      t="Those loyalty members spent close to thirty-seven billion dollars in 2025, up twenty percent. The app tells McDonald's what you order, when you order, and which offer will bring you back next week. And more sales in the restaurant mean more rent and more royalties for the company."),
 dict(v=("list", "Still growing", ["Nearly 2,300 new restaurants in 2025", "Delivery from ~41,000 restaurants", "Global comparable sales +3.1%", "Goal: 250 M active app users by 2027"]),
      t="McDonald's is still expanding, too. It opened nearly two thousand three hundred new restaurants in 2025. Delivery is offered from about forty-one thousand of them. Sales at existing restaurants rose a little over three percent, and the company is aiming for two hundred and fifty million active loyalty users by the end of 2027."),

 # ---------- OUTRO ----------
 dict(v=("chapter", "", "The Money Machine"),
      t="So let's put the whole machine together."),
 dict(v=("list", "The McDonald's money machine", ["Tiny menu → fast, cheap food", "Franchisees run 95% of restaurants", "McDonald's controls the land & buildings", "Rent + royalties on every sale", "The app keeps customers coming back"]),
      t="A small menu and a factory-style kitchen make food fast and cheap. Independent franchisees run almost every restaurant and carry the daily costs. McDonald's controls the land and the buildings underneath them. It collects rent and royalties on the sales. And the app keeps pulling customers back through the door."),
 dict(v=("quote", "The burger brings you in. The building pays the bills.", ""),
      t="McDonald's sells billions of burgers. But the real engine is the property under the arches, and the long contracts that turn every sale into rent."),
 dict(v=("end", "", ""),
      t="That's the money machine behind McDonald's. If you want to see how another giant really makes its money, subscribe to Money Machine Files, and tell me in the comments which company we should open next."),
]
