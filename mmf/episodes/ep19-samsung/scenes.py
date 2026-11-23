# Money Machine Files — Ep 19: How Samsung Really Makes Money
# Each scene: narration text + visual spec (+ optional photo query). *word* = highlighted caption keyword.

SCENES = [
 # ---------- COLD OPEN ----------
 dict(v=("title", "$80 BILLION", "Samsung's operating profit in just three months"),
      t="Between July and September 2026, Samsung Electronics made an operating profit of *one hundred and seven trillion won*. That is about eighty billion dollars, in a single quarter. No tech company had ever passed one hundred trillion won in three months."),
 dict(v=("quote", "Its phones lost money. Its chips made almost all of it.", ""),
      t="But here is the strange part. In that same quarter, Samsung's famous phone business *lost money*. Almost all of the profit came from something most people never see. So how does Samsung *really* make money?"),
 dict(v=("brand", "FILE #019  ·  SAMSUNG"),
      t="This is the money machine behind Samsung. Let's open the file."),

 # ---------- CH 1 ----------
 dict(v=("chapter", "1", "A Grocery Shop in Daegu"),
      t="Chapter one. A grocery shop in Daegu."),
 dict(v=("timeline", "MARCH 1, 1938", "Samsung Sanghoe opens in Daegu, Korea"),
      t="On March first, 1938, a young businessman named *Lee Byung-chul* opened a small trading company in the city of *Daegu*, in Korea. He called it Samsung Sanghoe. Samsung means *three stars* in Korean."),
 dict(v=("stat", "30,000 WON", "Samsung's starting capital in 1938", "Roughly $25 in today's money, by one estimate"), photo="dried fish market stall",
      t="It started with about *thirty thousand won*. The shop dealt in dried fish, fruit, vegetables and its own *noodles*, and sent goods to Manchuria and Beijing. No chips, no phones. Just groceries."),
 dict(v=("timeline", "1953", "Cheil Sugar: Korea's first sugar refinery"), photo="sugar factory industrial",
      t="After the Korean War, Lee built what the country was missing. In 1953 he set up *Korea's first sugar refinery*. Then came the largest *wool mill* in Korea. Later, insurance, cement, fertilizer and chemicals. Samsung was becoming a giant family group."),
 dict(v=("timeline", "1969", "Samsung Electronics is founded"), photo="vintage television set",
      t="In 1969 the group created *Samsung Electronics*. Its first product was a simple black and white television, made from 1970. When the founder found faults in the first batch, he reportedly ordered them *destroyed*. Remember that idea. It comes back."),

 # ---------- CH 2 ----------
 dict(v=("chapter", "2", "The Chip Gamble"),
      t="Chapter two. The chip gamble."),
 dict(v=("timeline", "1974", "Lee Kun-hee buys Korea Semiconductor"), photo="silicon wafer close up",
      t="In 1974, the founder's son, *Lee Kun-hee*, bought a struggling company called Korea Semiconductor, using his own money. His father was against it. Samsung bought the rest in 1977, and renamed it Samsung Semiconductor."),
 dict(v=("timeline", "MARCH 1983", "Samsung announces a huge bet on memory chips"), photo="clean room semiconductor factory",
      t="In March 1983, Samsung publicly announced a massive investment in *memory chips*. Memory is the part of a computer that holds data while it works. At the time, Japanese and American companies owned this market. Korea was more than ten years behind."),
 dict(v=("stat", "3RD IN THE WORLD", "Samsung's 64K DRAM, after the U.S. and Japan", "The gap shrank to about four years"), photo="computer memory chips circuit board",
      t="Samsung went all in. It built a 64K memory chip, called *DRAM*, becoming the third in the world to make it, after America and Japan. Suddenly, the gap was only *about four years*. In 1984, its Giheung chip plant began running. And in 1986, Intel gave up on DRAM."),
 dict(v=("timeline", "1987", "Lee Kun-hee becomes chairman"), photo="seoul city skyline night",
      t="In 1987, the founder died, and Lee Kun-hee became chairman. He called it Samsung's *second foundation*. But he had a problem. Samsung was big, but its products had a reputation for being *cheap*."),

 # ---------- CH 3 ----------
 dict(v=("chapter", "3", "Change Everything"),
      t="Chapter three. Change everything."),
 dict(v=("compare", "SAMSUNG TV", ["Dusty shelf", "about $100 cheaper", "Ignored"], "SONY TV", ["Front of store", "full price", "Bought"]),
      t="In early 1993, Lee walked into an electronics store in Southern California. Samsung TVs sat *gathering dust* at the back, priced almost a hundred dollars below a comparable Sony. Shoppers walked straight past them."),
 dict(v=("timeline", "JUNE 7, 1993", "The Frankfurt declaration to about 200 executives"), photo="frankfurt city skyline",
      t="That June, he flew about two hundred executives to a hotel in *Frankfurt*, Germany, and talked to them for three days. He had seen a video of workers fixing faulty washing machine lids with knives. Samsung, he said, had to choose *quality over quantity*."),
 dict(v=("quote", "Change everything except your wife and children.", "Lee Kun-hee, Frankfurt, 1993"),
      t="His most famous line was this. Change *everything*, except your wife and children. In other words, nothing at Samsung was safe from change, not the old habits, not the old products, not the old way of chasing volume."),
 dict(v=("stat", "150,000", "phones, fax machines and TVs burned in one day", "Worth about $50 million"), photo="bonfire flames night",
      t="Then came the bonfire. In 1995, mobile phones given as New Year's gifts turned out to be faulty. At the *Gumi* factory, about one hundred and fifty thousand phones, fax machines and TVs, worth around *fifty million dollars*, were piled up and burned in front of the workers."),
 dict(v=("stat", "51.5%", "Samsung's share of Korean mobile phone sales", "1995, ahead of Motorola"), photo="old mobile phones collection",
      t="The message landed. That same year, Samsung took first place in phone sales in Korea, with *fifty-one point five percent* of the market, ahead of Motorola."),
 dict(v=("timeline", "2003", "Samsung stops making old tube TVs"), photo="old crt television pile",
      t="He kept taking big risks. In 2003, he ordered Samsung to stop making old *tube TVs*, even though they were still about twenty-seven percent of its TV volume. Samsung moved everything to thin *flat screens*, before most rivals were ready."),
 dict(v=("stat", "20 YEARS", "as the world's No. 1 TV brand", "29.1% revenue share in 2025 (Omdia)"), photo="large flat screen tv living room",
      t="And those dusty TVs? In 2006, Samsung became the *number one TV brand* in the world, passing Sony. It has stayed there for twenty years in a row. In 2025, it took about twenty-nine percent of all TV sales worldwide."),

 # ---------- CH 4 ----------
 dict(v=("chapter", "4", "Selling to the Enemy"),
      t="Chapter four. Selling to the enemy."),
 dict(v=("timeline", "2010", "The first Galaxy S smartphone"), photo="smartphone on table modern",
      t="In 2010, Samsung launched the first *Galaxy S* smartphone, running Google's Android. More than twenty-five million were sold around the world. By 2012, Samsung was selling more mobile phones than anyone else on earth."),
 dict(v=("stat", "$5.3 BILLION", "minimum cost of the Galaxy Note 7 recall", "More than 2.5 million phones, 2016"),
      t="It was not always smooth. In 2016, the *Galaxy Note 7* had batteries that could catch fire. Samsung recalled more than two and a half million phones and then killed the model. The bill: at least *five point three billion dollars*."),
 dict(v=("bars", "Global smartphone share, 2025", [("Apple", 20, "20%"), ("Samsung", 19, "19%"), ("Xiaomi", 18, "18%")]),
      t="Today the phone race is tight. In 2025, according to Counterpoint, *Apple* had about twenty percent of the world's smartphone market, and Samsung was a close second with nineteen percent."),
 dict(v=("flow", "The parts machine", ["Samsung", "Apple & rivals", "Shoppers"], ["sells screens & chips", "buy phones"],
         "Whoever wins the phone war  →  Samsung's parts are often inside", "Samsung"),
      t="But here is Samsung's quiet trick. It does not only sell phones. It sells the *parts* inside phones, including to its biggest rival. Screens, memory, storage. Even when you buy a competitor's phone, Samsung can still get paid."),
 dict(v=("stat", "125 MILLION", "OLED screens shipped to Apple in 2025", "UBI Research estimate"), photo="phone screen display panel",
      t="In 2025, Samsung's display company shipped an estimated *one hundred and twenty-five million* OLED screens to Apple. One report said Samsung made close to sixty-five percent of the screens for the iPhone 17 range."),

 # ---------- CH 5 ----------
 dict(v=("chapter", "5", "Where the Money Comes From"),
      t="Chapter five. Where the money comes from."),
 dict(v=("compare", "FULL YEAR 2025", ["333.6 tn won", "revenue", "43.6 tn won operating profit"], "Q3 2026 ALONE", ["195.3 tn won", "revenue", "107.4 tn won operating profit"]),
      t="In all of 2025, Samsung had revenue of three hundred and thirty-three point six trillion won and an operating profit of forty-three point six trillion. Then, in just *one quarter* of 2026, it made *more than twice* that whole year's profit."),
 dict(v=("bars", "Samsung revenue, Q3 2026 (trillion won)", [("Chips (DS)", 147.1, "147.1"), ("Phones & networks", 37.7, "37.7"), ("TVs & appliances", 13.9, "13.9"), ("Displays", 8.0, "8.0")]),
      t="Look at July to September 2026. The *chip* division brought in one hundred and forty-seven trillion won. Phones and networks, thirty-seven point seven. TVs and home appliances, thirteen point nine. And displays, eight trillion."),
 dict(v=("pie", "99%", "of Samsung's Q3 2026 operating profit came from memory chips"), photo="server room data center lights",
      t="Now the profit. The chip division earned an operating profit of one hundred and six point five trillion won. According to Light Reading, about *ninety-nine percent* of Samsung's whole profit came from memory chips."),
 dict(v=("compare", "CHIPS", ["+106.5 tn won", "operating profit", "Q3 2026"], "PHONES & NETWORKS", ["-0.6 tn won", "operating loss", "Q3 2026"]),
      t="And the phones? Phones and networks made an *operating loss* of about zero point six trillion won. TVs and appliances lost money too. The products with the Samsung name on them were barely paying their way."),
 dict(v=("quote", "Samsung's chip boom made its own phones more expensive to build.", ""),
      t="Here is the twist. Memory chips became so expensive that the cost of building phones went up, *including Samsung's own*. The memory boom that made Samsung rich also squeezed its phone business. One side of the machine was paying the other."),

 dict(v=("stat", "10 TRILLION WON", "hit from record exchange rates, Q3 2026", "Phones: a second loss-making quarter in a row"), photo="currency exchange board",
      t="Other things hurt too. Samsung's finance chief said record exchange rates cost the company about *ten trillion won* in the quarter. It was the phone unit's *second loss-making quarter* in a row, and sales of network equipment fell by about a third. Even so, the company as a whole had never earned more."),

 # ---------- CH 6 ----------
 dict(v=("chapter", "6", "The AI Memory Rush"),
      t="Chapter six. The AI memory rush."),
 dict(v=("flow", "Why AI needs memory", ["AI data centers", "Memory makers", "Samsung"], ["need huge amounts of fast memory", "sell HBM & server DRAM"],
         "Every AI chip needs stacks of high-bandwidth memory beside it", "Samsung"),
      t="Why the boom? *Artificial intelligence*. The giant chips that train and run AI need very fast memory stacked right beside them, called *HBM*, or high-bandwidth memory. Data centers also need mountains of server memory and storage. Samsung makes all of it."),
 dict(v=("stat", "+344%", "chip sales growth, Q3 2026 vs Q3 2025", "147.1 trillion won, about $110 billion"), photo="semiconductor wafer factory robot",
      t="In the third quarter of 2026, Samsung's chip sales were up *three hundred and forty-four percent* from a year earlier. It said it significantly scaled up sales of its newest memory, *HBM4*."),
 dict(v=("stat", "84.4 TRILLION WON", "Samsung's expected capital spending in 2026", "About $63 billion, up roughly 60%"), photo="construction cranes factory site",
      t="To keep up, Samsung is spending like never before. It expects to invest about *eighty-four trillion won* in 2026, roughly sixty-three billion dollars, mostly on chip factories. In 2025 it also spent a record thirty-seven point seven trillion won on research."),
 dict(v=("quote", "Memory is a boom-and-bust business. Right now, it is booming.", ""),
      t="The risk is simple. Memory prices go up and down in big waves. Samsung's finance chief expects AI demand to *far exceed supply* in 2027. But if the AI spending slows, or rivals build too many factories, prices can fall fast, and so can Samsung's profit."),

 # ---------- OUTRO ----------
 dict(v=("chapter", "", "The Money Machine"),
      t="So let's put the whole machine together."),
 dict(v=("list", "The Samsung money machine", ["Bet early on memory chips", "Sell parts to rivals, even Apple", "Sell phones, TVs and appliances", "Ride the AI memory boom"]),
      t="Bet early on memory chips, and never let go. Sell screens and chips to rivals, even Apple. Sell phones, TVs and appliances under its own name. And now, ride the AI memory boom, which brings in almost all of the profit."),
 dict(v=("quote", "Samsung started by selling noodles. It now sells the memory that AI runs on.", ""),
      t="It started as a grocery shop in Daegu with thirty thousand won. It burned its own phones to fix its quality. Today, Samsung earns more in three months than in all of 2025. The big question: what happens when the memory boom cools down?"),
 dict(v=("end", "", ""),
      t="That's the money machine behind Samsung. If you want to see how another giant really makes its money, subscribe to Money Machine Files, and tell me in the comments which company we should open next."),
]
