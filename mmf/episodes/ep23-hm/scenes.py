# Money Machine Files — Ep 23: How H&M Really Makes Money
# Each scene: narration text + visual spec (+ optional photo query). *word* = highlighted caption keyword.

SCENES = [
 # ---------- COLD OPEN ----------
 dict(v=("title", "SEK 228 BILLION", "H&M Group net sales, 2025 — about $24 billion"), photo="clothing store rails colorful",
      t="In its 2025 financial year, the H&M Group sold clothes worth about *two hundred and twenty-eight billion Swedish kronor*. That is roughly twenty-four billion US dollars, from T-shirts, jeans and dresses."),
 dict(v=("quote", "It doesn't own a single factory.", ""),
      t="And yet H&M does not own *a single factory*. It doesn't sew the clothes. It doesn't weave the fabric. So how does H&M *really* make money? And why is one family quietly buying the whole company back?"),
 dict(v=("brand", "FILE #023  ·  H&M"),
      t="This is the money machine behind H&M. Let's open the file."),

 # ---------- CH 1 ----------
 dict(v=("chapter", "1", "One Shop Called Hers"),
      t="Chapter one. One shop called hers."),
 dict(v=("timeline", "1946", "A trip to New York"), photo="busy city department store street vintage",
      t="The story starts with a Swedish businessman named *Erling Persson*. Just after the Second World War, he travelled to the United States, and he was amazed by the big American stores, selling huge volumes of goods quickly and cheaply."),
 dict(v=("timeline", "1947", "Hennes opens in Västerås, Sweden"), photo="small town shop window sweden",
      t="He came home with an idea. In 1947 he opened a women's clothing shop in the Swedish town of *Västerås*. He called it *Hennes*, which simply means hers in Swedish. Fashion for women, at prices ordinary people could afford."),
 dict(v=("timeline", "1964", "First store abroad: Norway"), photo="snowy scandinavian shopping street",
      t="It grew slowly at first, then faster. In 1964 Hennes opened its first shop outside Sweden, in *Norway*. Denmark followed in 1968."),
 dict(v=("timeline", "1968", "Hennes buys Mauritz Widforss"), photo="vintage hunting fishing equipment shop",
      t="The same year came a strange purchase. Persson bought a Stockholm shop called *Mauritz Widforss*, which sold *hunting and fishing gear*. With it came a stock of men's clothes. So Hennes started selling menswear, and the company got its new name: Hennes and Mauritz. Later, simply *H&M*."),
 dict(v=("list", "How H&M grew", ["1974: listed on the Stockholm stock exchange", "1998: starts selling online in Sweden", "2000: first US store, Fifth Avenue", "Today: around 4,100 stores"]),
      t="In 1974 the company was listed on the *Stockholm* stock exchange. In 1998 it began selling online, starting in Sweden. In 2000 it opened its first American store, on Fifth Avenue in New York. By the end of 2025 the group had about *four thousand one hundred* stores."),

 dict(v=("stat", "130,000", "people working for the H&M Group (2025)", "Online sales in more than 60 markets"), photo="clothing store staff folding shirts",
      t="From one shop in Västerås, the group grew to around *one hundred and thirty thousand* employees. Its online shops now reach customers in more than sixty markets. Not bad for a business that started with a single idea from a trip to New York."),

 # ---------- CH 2 ----------
 dict(v=("chapter", "2", "The Factory-Free Machine"),
      t="Chapter two. The factory-free machine."),
 dict(v=("compare", "H&M DOES", ["Design the clothes", "Order from suppliers", "Ship, store and sell"], "SUPPLIERS DO", ["Own the factories", "Cut and sew", "Employ the workers"]),
      t="Here is the first secret. H&M says on its own website that it *does not own any factories*. It designs the clothes, decides how many to make, and sells them. Independent suppliers do the actual manufacturing."),
 dict(v=("stat", "969+", "tier-1 factories making H&M products", "Used by more than 554 suppliers (January 2026)"), photo="sewing machines textile factory floor",
      t="And the network is huge. In early 2026, H&M said it worked with more than *five hundred and fifty* suppliers, who used more than *nine hundred and sixty* first-tier factories in Europe, Asia and North America."),
 dict(v=("pie", "30%", "of H&M's contracted clothing factories are in China (approx., Feb 2026)"),
      t="The biggest production countries are *China* and *Bangladesh*. One analysis of H&M's published supplier list found that roughly thirty percent of its contracted clothing factories were in China. Others are in Türkiye, India, Pakistan, Portugal and Morocco."),
 dict(v=("flow", "How a T-shirt makes money", ["Design in Sweden", "Supplier factory", "Warehouse", "Store or app"], ["order", "ship", "sell"],
         "H&M owns the brand and the shop  →  suppliers own the machines", "Store"),
      t="Why work like this? Because factories are *expensive*. They need machines, buildings and thousands of workers. By leaving that to suppliers, H&M can move orders between countries, and spend its own money on what customers actually see: the *brand* and the *store*."),
 dict(v=("quote", "Fashion and quality at the best price.", "H&M's business idea"),
      t="H&M describes its business idea as fashion and quality at the *best price*, in a sustainable way. The key word is price. The machine only works if huge volumes of clothes flow through it, fast."),

 # ---------- CH 3 ----------
 dict(v=("chapter", "3", "Where the Kronor Go"),
      t="Chapter three. Where the kronor go."),
 dict(v=("stat", "53.4%", "gross margin, 2025", "Same as in 2024"), photo="folded t-shirts stack store table",
      t="So how much does H&M keep? In 2025, after paying for the clothes themselves, it kept about *fifty-three kronor* of every hundred in sales. That's the gross margin. Cheap fashion, but marked up a lot."),
 dict(v=("bars", "Every SEK 100 of H&M sales, 2025", [("Cost of the clothes", 46.6, "SEK 46.6"), ("Stores, staff & marketing", 45.2, "SEK 45.2"), ("Operating profit", 8.1, "SEK 8.1")]),
      t="But most of that disappears again. Stores, rent, staff, warehouses and marketing ate around *forty-five kronor* of every hundred. That left about *eight kronor* of operating profit. This is our own arithmetic from the company's reported numbers."),
 dict(v=("compare", "2024", ["SEK 17.3 billion", "operating profit", "7.4% margin"], "2025", ["SEK 18.4 billion", "operating profit", "8.1% margin"]),
      t="In 2025, operating profit was about *eighteen point four billion kronor*, up from seventeen point three billion the year before. And that happened even though sales in Swedish kronor slipped. In local currencies, sales grew only about two percent."),
 dict(v=("stat", "−12%", "inventory at the end of 2025", "SEK 35.4 billion of clothes in stock"), photo="clothing warehouse boxes shelves",
      t="How did profit rise when sales barely moved? Partly by *cutting costs*, and partly by holding *less stock*. At the end of 2025, H&M's inventory was twelve percent lower than a year earlier. Fewer unsold clothes means fewer big discounts."),
 dict(v=("stat", "4,101", "stores at the end of 2025", "152 fewer than a year earlier"), photo="shopping mall interior escalators",
      t="And it is closing shops. At the end of 2025, the group had *four thousand one hundred and one* stores, about one hundred and fifty fewer than a year before. Fewer, better stores, with more sales moving to the app and website."),

 dict(v=("stat", "SEK 12.1 BILLION", "profit after tax, 2025", "SEK 7.58 per share"),
      t="After interest and tax, H&M's profit for 2025 was about *twelve point one billion kronor*. That's a little over five kronor of every hundred in sales. Small per T-shirt, but enormous when you sell hundreds of millions of them. And the business threw off about thirty-one billion kronor of cash from its operations."),

 # ---------- CH 4 ----------
 dict(v=("chapter", "4", "Designer Names, High Street Prices"),
      t="Chapter four. Designer names, high street prices."),
 dict(v=("timeline", "NOVEMBER 2004", "Karl Lagerfeld for H&M"), photo="crowd queue outside shop night",
      t="In 2004, H&M tried something new. It asked the famous designer *Karl Lagerfeld* to create a collection for its stores. Shoppers queued outside the stores, and much of the collection *sold out* fast. For a cheap high street chain, it was a sensation."),
 dict(v=("quote", "A designer collaboration is an advert people pay for.", ""),
      t="That became a formula. Almost every year since, a big designer name has made a limited collection for H&M. The collections are small, but the *headlines* are huge. Millions of people walk into an H&M store, and most of them leave with something else."),
 dict(v=("list", "The H&M Group brands", ["H&M (with HOME, Move, Beauty)", "COS (2007)", "Weekday & Monki (2008)", "& Other Stories (2013)", "ARKET (2017)", "Sellpy (resale)"]),
      t="H&M also built a family of brands. *COS* arrived in 2007, aimed at shoppers who want simpler, pricier clothes. Weekday and Monki came in 2008. And Other Stories in 2013, and *ARKET* in 2017. One group, many price levels."),
 dict(v=("stat", "0.8%", "of group sales came from resale in 2025", "Up 31% from 2024 · in 26 markets"), photo="second hand clothes rack vintage",
      t="And there's a newer bet: *second-hand*. Through its resale platform Sellpy and its own brands, the group sells used clothes in twenty-six markets. In 2025 resale was still small, under one percent of sales, but it grew by about thirty-one percent."),

 # ---------- CH 5 ----------
 dict(v=("chapter", "5", "The Family Buying It Back"),
      t="Chapter five. The family buying it back."),
 dict(v=("timeline", "1982", "Stefan Persson takes over"), photo="stockholm old town waterfront",
      t="H&M has always been a family company at heart. In 1982, the founder's son, *Stefan Persson*, became managing director. Today his son, *Karl-Johan Persson*, chairs the board, and the CEO is Daniel Ervér."),
 dict(v=("stat", "69%", "of H&M's shares owned by the Persson family", "About 85% of the votes (October 2026)"),
      t="And the family keeps buying. Through its investment company *Ramsbury Invest*, the Persson family has bought tens of millions of shares. By the end of October 2026, it held about *sixty-nine percent* of the company, and about eighty-five percent of the votes."),
 dict(v=("compare", "START OF 2021", ["49.5%", "of the shares", "Family held half"], "OCTOBER 2026", ["69.1%", "of the shares", "And still buying"]),
      t="At the start of 2021, the family owned just under half. In less than six years it added almost *twenty percentage points*. That's a lot of money, spent on a company most people think of as just a high street shop."),
 dict(v=("quote", "In Sweden, an owner with 90% of the shares can buy out everyone else.", ""),
      t="Why does it matter? Under Swedish rules, an owner with *ninety percent* of a company's shares can force the remaining shareholders to sell. The family hasn't said it plans to take H&M private. But some analysts think it might, one day."),
 dict(v=("stat", "SEK 7.10", "dividend per share proposed for 2025", "Up from SEK 6.80"),
      t="And every share the family owns pays it a *dividend*. For 2025, H&M proposed seven kronor and ten öre per share. The more shares the family holds, the bigger its slice of every payout."),

 # ---------- CH 6 ----------
 dict(v=("chapter", "6", "The Newest Numbers"),
      t="Chapter six. The newest numbers."),
 dict(v=("stat", "SEK 6.0 BILLION", "operating profit, June–August 2026", "Up 23% · margin 10.6%"), photo="summer clothes shop window display",
      t="H&M's latest report covered the summer of 2026. In the three months from June to August, sales were almost flat, but operating profit jumped about *twenty-three percent*, to six billion kronor."),
 dict(v=("list", "Why profit jumped", ["Higher gross margin: 54.0%", "About 1.6 points of one-off tariff effects", "Lower costs", "About 2% fewer stores"]),
      t="Part of that came from a better gross margin, fifty-four percent. But H&M said about one point six percentage points came from *one-off* effects linked to tariffs and import costs. Lower costs and fewer stores did the rest."),
 dict(v=("compare", "NINE MONTHS 2025", ["SEK 12.0 billion", "operating profit", "7.1% margin"], "NINE MONTHS 2026", ["SEK 13.5 billion", "operating profit", "8.3% margin"]),
      t="Over the first nine months of its 2026 financial year, operating profit reached about *thirteen point five billion* kronor, with a margin of eight point three percent. Sales in local currencies were flat. The machine is squeezing more profit out of the same pile of clothes."),
 dict(v=("quote", "Selling more is hard. Keeping more is the new plan.", ""),
      t="That's the story of H&M today. Growth is slow, and rivals are everywhere. So the plan is to *keep more* of every krona: smarter buying, less stock, fewer discounts and fewer, better stores."),

 # ---------- OUTRO ----------
 dict(v=("chapter", "", "The Money Machine"),
      t="So let's put the whole machine together."),
 dict(v=("list", "The H&M money machine", ["Design it, don't make it", "Hundreds of supplier factories", "Huge volumes at low prices", "Designer collabs bring the crowds", "A family that keeps buying in"]),
      t="Design the clothes, but don't make them. Use hundreds of supplier factories. Sell huge volumes at low prices. Use designer collaborations to pull in the crowds. And behind it all, a family that keeps buying more of the machine."),
 dict(v=("quote", "It started as a shop called Hers. Now one family owns most of the empire.", ""),
      t="It started in 1947, with one shop for women in a small Swedish town. Almost eighty years later, the same family is slowly taking the whole empire back."),
 dict(v=("end", "", ""),
      t="That's the money machine behind H&M. If you want to see how another giant really makes its money, subscribe to Money Machine Files, and tell me in the comments which company we should open next."),
]
