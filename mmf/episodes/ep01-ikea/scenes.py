# Money Machine Files — Ep 1: How IKEA Really Makes Money
# Each scene: narration text + visual spec

SCENES = [
 # ---------- COLD OPEN ----------
 dict(v=("title", "€44.5 BILLION", "IKEA retail sales in one year"),
      t="Every year, people around the world spend about forty-four and a half billion euros at IKEA. They walk through the maze, eat the meatballs, carry home flat boxes, and build the furniture themselves."),
 dict(v=("quote", "Who actually gets the money?", ""),
      t="But here is the strange part. The company that runs most IKEA stores is not the company that owns IKEA. And the company that owns the IKEA brand runs almost no stores at all. So when you pay for a bookshelf, who actually gets the money?"),
 dict(v=("brand", "FILE #001  ·  IKEA"),
      t="This is the money machine behind IKEA. Let's open the file."),

 # ---------- CH 1 ----------
 dict(v=("chapter", "1", "A Boy With Matches"),
      t="Chapter one. A boy with matches."),
 dict(v=("timeline", "1943", "17-year-old Ingvar Kamprad registers IKEA"),
      t="In 1943, in the small Swedish region of Småland, a seventeen-year-old named Ingvar Kamprad registered a business. He sold pens, wallets, picture frames and watches, cheap little things, often by mail order."),
 dict(v=("acronym", "IKEA", ""),
      t="The name was simple. I and K for Ingvar Kamprad. E for Elmtaryd, the farm where he grew up. And A for Agunnaryd, his home village. Four letters that would one day be on stores in more than sixty countries."),
 dict(v=("timeline", "1953", "First showroom opens in Älmhult"),
      t="Soon he moved into furniture. But his prices were so low that customers did not trust the quality. So in 1953 he opened a showroom in the town of Älmhult, where people could touch the furniture and sit on it before ordering. That idea, let people try first, is still the heart of every IKEA store today."),
 dict(v=("boycott", "", ""),
      t="Then came trouble. Rival furniture sellers did not like this low-price newcomer, and in the late 1950s they pushed Swedish manufacturers to stop supplying him. IKEA was being shut out. Instead of giving up, Kamprad went looking for new suppliers outside Sweden, and learned a lesson that shaped everything after: if you control how products are designed and made, nobody can squeeze you."),

 # ---------- CH 2 ----------
 dict(v=("chapter", "2", "The Table With No Legs"),
      t="Chapter two. The table with no legs."),
 dict(v=("timeline", "1956", "Gillis Lundgren takes the legs off the LÖVET table"),
      t="In 1956, an IKEA designer named Gillis Lundgren was trying to fit a table called LÖVET into a car. It would not go in. So he took the legs off. Suddenly the table lay flat, and it fit easily."),
 dict(v=("flatpack", "", ""),
      t="That small moment created the flat pack. And the flat pack is not just a box. It is a money machine of its own. Flat furniture takes far less space on trucks and in warehouses. It gets damaged less on the way. And the most expensive step of all, putting it together, is done by the customer, for free."),
 dict(v=("list", "What the flat pack saves", ["Less space on trucks and ships", "Fewer damaged products", "Smaller warehouses, faster stock", "Customer does the assembly"]),
      t="Think about what that means. Every Allen key you have ever turned in your living room is labour that IKEA did not have to pay for. Those savings go into lower prices, and lower prices bring in more customers. More customers mean bigger orders from factories, and bigger orders mean even lower costs. It is a loop that keeps feeding itself."),

 # ---------- CH 3 ----------
 dict(v=("chapter", "3", "The Maze and the Meatballs"),
      t="Chapter three. The maze and the meatballs."),
 dict(v=("timeline", "1958", "First IKEA store opens in Älmhult"),
      t="The first real IKEA store opened in Älmhult in 1958. It was the biggest furniture display in Scandinavia. Two years later, in 1960, it added something unusual for a furniture shop: a restaurant."),
 dict(v=("quote", "It's difficult to do business with someone on an empty stomach.", "— Ingvar Kamprad"),
      t="Kamprad had noticed that shoppers left the store at lunchtime to eat in town, and many never came back. His answer was to feed them inside. As he put it, it is hard to do business on an empty stomach."),
 dict(v=("stat", "1 BILLION+", "meatballs sold every year", "Restaurant · Bistro · Swedish Food Market"),
      t="Today IKEA sells more than a billion meatballs a year. Inside the company, people have joked that the meatballs are the best sofa sellers. The food is cheap on purpose. A full stomach keeps you in the store longer, and the longer you stay, the more you buy."),
 dict(v=("maze", "", ""),
      t="And then there is the layout. Most IKEA stores guide you along one long path. Showroom first, upstairs, full of complete rooms that make you imagine your own home. Then the restaurant. Then the market hall downstairs, packed with candles, plants, glasses and storage boxes. Then the warehouse, where you pick up your flat packs yourself."),
 dict(v=("list", "Why the path works", ["You see every department", "Rooms sell the dream, not one item", "Small cheap extras fill the bag", "Self-serve warehouse saves staff costs"]),
      t="You came for one shelf. You leave with the shelf, a lamp, two cushions, a plant and a pack of tea lights. Those small items are cheap, but they add up across hundreds of millions of visits. In its last financial year, Ingka, IKEA's biggest retailer, counted seven hundred and thirty six million store visits."),

 # ---------- CH 4 ----------
 dict(v=("chapter", "4", "Two Companies, One Brand"),
      t="Chapter four. Two companies, one brand. This is where the real money machine is hidden."),
 dict(v=("compare", "INTER IKEA GROUP", ["Owns the IKEA brand & concept", "Designs & develops the range", "Runs supply & wholesale", "Owns 1 store (Delft)"],
         "INGKA GROUP", ["Largest IKEA franchisee", "Runs stores in 31 markets", "≈87% of all IKEA retail sales", "Pays to use the brand"]),
      t="IKEA is not one company. It is two big groups that share a founder and a history but have different owners. On one side is Inter IKEA Group. It owns the IKEA brand and the IKEA concept, and it develops and supplies the product range. On the other side is Ingka Group, the largest IKEA franchisee. Ingka runs the stores in thirty-one markets and makes about eighty-seven percent of all IKEA retail sales."),
 dict(v=("stat", "3%", "of net sales", "Every IKEA franchisee pays this to Inter IKEA, every year"),
      t="Every IKEA store in the world, except one test store in Delft in the Netherlands, is run under a franchise. And every franchisee pays Inter IKEA a fee of three percent of its net sales. Three percent does not sound like much. But apply it to every IKEA store on the planet."),
 dict(v=("stat", "€1.32 BILLION", "franchise fees in FY25", "Inter IKEA Group, financial year 2025"),
      t="In financial year 2025, those franchise fees came to about one point three billion euros. Just for the right to use the name, the concept and the know-how."),
 dict(v=("flow", "How the money flows", ["Factories", "Inter IKEA", "Stores", "You"], ["makes", "wholesale", "retail"]),
      t="But the fee is actually the smaller stream. The bigger one is wholesale. Franchisees buy the products they sell from Inter IKEA. So Inter IKEA works like a giant wholesaler. Factories make the products, Inter IKEA sells them to the stores, and the stores sell them to you."),
 dict(v=("bars", "Inter IKEA Group revenue, FY25", [("Sales of goods", 24860, "€24.9 bn"), ("Franchise fees", 1320, "€1.3 bn"), ("Other income", 126, "€0.1 bn")]),
      t="Look at the numbers. In 2025, Inter IKEA had total revenue of about twenty-six point three billion euros. Almost twenty-five billion of that came from selling goods to franchisees. The franchise fee was about one point three billion. And the group's net income was around one and a half billion euros."),
 dict(v=("compare", "INTER IKEA EARNS", ["Wholesale on every product", "3% fee on every sale", "No store rent, no store staff"],
         "INGKA EARNS", ["The retail margin", "Food, services, delivery", "Shopping centres & investments"]),
      t="So the money is collected twice. Once when the product is sold to the store, and once more as a fee on the store's sales. Inter IKEA does not have to pay for thousands of store workers or giant buildings. The franchisees carry most of those costs, while the brand owner earns on almost every item that moves."),

 # ---------- CH 5 ----------
 dict(v=("chapter", "5", "The Store Side"),
      t="Chapter five. The store side."),
 dict(v=("bars", "Ingka Group, FY25", [("Revenue", 41500, "€41.5 bn"), ("Gross profit", 14421, "€14.4 bn"), ("Net profit", 1411, "€1.4 bn")]),
      t="Now let's look at Ingka. In financial year 2025, Ingka Group had revenue of forty-one and a half billion euros. After paying for the products, its gross profit was about fourteen point four billion. But after staff, stores, logistics, the franchise fee and taxes, the net profit was about one point four billion. That is a margin of only around three to four percent."),
 dict(v=("pie", "30%", "of IKEA Retail sales were online in FY25"),
      t="Ingka makes money in more ways than selling furniture. About thirty percent of its retail sales now happen online. It earns from delivery, from assembly and planning services, and from food. It also owns Ingka Centres, which runs thirty seven large shopping centres built around IKEA stores, where it collects rent from other shops."),
 dict(v=("list", "Ingka's three businesses", ["IKEA Retail — stores, online, food", "Ingka Centres — 37 shopping 'meeting places'", "Ingka Investments — wind, solar, forests"]),
      t="And through Ingka Investments, it puts billions into things like wind farms, solar parks and forests. That gives IKEA its own long-term assets, renewable energy for its stores, and wood for its products."),
 dict(v=("stat", "€2.1 BILLION", "spent cutting prices in FY24", "Lower prices → more items sold"),
      t="Here is a surprising move. In financial year 2024, IKEA invested more than two billion euros to lower its prices. Sales in euros went down. But in 2025, IKEA sold more items and welcomed more customers. Kamprad's old rule was still working. Cut the price, win the volume, and the volume pays you back."),

 # ---------- CH 6 ----------
 dict(v=("chapter", "6", "Owned by a Foundation"),
      t="Chapter six. A company owned by a foundation."),
 dict(v=("ownership", "", ""),
      t="So who owns all this? Not shareholders. IKEA is not on any stock market. In 1982, Kamprad set up a Dutch foundation called Stichting INGKA Foundation. The name comes from his own, ING for Ingvar, KA for Kamprad. That foundation owns Ingka Holding, the parent of Ingka Group. Inter IKEA, on the other side, is today owned by another foundation, the Inter IKEA Foundation."),
 dict(v=("split", "85%", "15%"),
      t="Ingka's rule is simple. Eighty-five percent of its net profit is put back into the business. The other fifteen percent goes to the INGKA Foundation, which funds the IKEA Foundation, a charity working mainly against climate change and poverty."),
 dict(v=("list", "Why this structure?", ["No hostile takeover is possible", "No pressure from stock markets", "Long-term decisions", "Critics: built to cut taxes"]),
      t="Kamprad said he wanted IKEA to last forever, safe from takeovers and free from stock market pressure. Critics have argued for years that the structure was also designed to reduce taxes, and journalists have studied it in detail. For its part, Ingka reported an effective tax rate of about thirty-three percent for 2025. Either way, this structure gives IKEA something rare. It can think in decades, not in quarters."),

 # ---------- OUTRO ----------
 dict(v=("chapter", "", "The Money Machine"),
      t="So let's put the whole machine together."),
 dict(v=("machine", "", ""),
      t="Flat packs cut the cost of moving and storing furniture. Customers do the assembly for free. The maze and the meatballs keep people in the store and fill their bags. Massive volume brings down prices from factories. Franchisees run the stores and carry the costs. And the brand owner earns twice, on wholesale and on a three percent fee, on almost every item sold."),
 dict(v=("quote", "Low prices are not the cost of the business. They are the business.", ""),
      t="IKEA's low prices are not a sacrifice. They are the engine. Every cheap bookshelf pulls in another customer, and every customer feeds the machine."),
 dict(v=("end", "", ""),
      t="That's the money machine behind IKEA. If you want to see how another giant really makes its money, subscribe to Money Machine Files, and tell me in the comments which company we should open next."),
]
