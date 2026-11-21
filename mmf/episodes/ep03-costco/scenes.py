# Money Machine Files — Ep 3: How Costco Really Makes Money
# Each scene: narration text + visual spec

SCENES = [
 # ---------- COLD OPEN ----------
 dict(v=("title", "$297 BILLION", "of goods sold by Costco in one year"),
      t="In its 2026 financial year, Costco sold about two hundred and ninety-seven billion dollars worth of groceries, televisions, tyres, petrol and giant boxes of everything."),
 dict(v=("quote", "So why does Costco make almost half its profit before you buy a thing?", ""),
      t="That is one of the biggest piles of sales in the world. But here is the strange part. Costco makes almost no money on the things it sells. Around half of its operating profit comes from a small plastic card in your wallet. So what is Costco really selling?"),
 dict(v=("brand", "FILE #003  ·  COSTCO"),
      t="This is the money machine behind Costco. Let's open the file."),

 # ---------- CH 1 ----------
 dict(v=("chapter", "1", "A Warehouse in a Hangar"),
      t="Chapter one. A warehouse in a hangar."),
 dict(v=("timeline", "1976", "Price Club opens in San Diego"),
      t="The story starts in San Diego. In July 1976, a retailer named Sol Price and his son Robert opened a store called Price Club. It sat inside a row of old aircraft hangars that had once belonged to the billionaire Howard Hughes."),
 dict(v=("list", "The Price Club idea", ["Sell to members only", "Bare concrete floors, no decoration", "Huge packs, very few products", "Prices just above cost"]),
      t="The idea was simple and a little odd. You had to be a member to shop. The building looked like a warehouse because it was one. There were far fewer products than a normal store, sold in big packs, at prices only a little above what the store paid for them."),
 dict(v=("timeline", "1983", "First Costco warehouse opens in Seattle"),
      t="The model worked so well that others copied it. On the fifteenth of September 1983, Jim Sinegal and Jeffrey Brotman opened the first Costco warehouse in Seattle, using the same members-only playbook."),
 dict(v=("timeline", "1993", "Costco and Price Club merge"),
      t="Ten years later the two rivals joined forces. In 1993, Price Club turned down an offer from Walmart and merged with Costco instead, creating a company called PriceCostco. By 1997 it had gone back to one simple name. Costco."),

 # ---------- CH 2 ----------
 dict(v=("chapter", "2", "The Card Is the Product"),
      t="Chapter two. The card is the product."),
 dict(v=("compare", "GOLD STAR", ["$65 a year (US)", "Was $60 until Sept 2024", "Free household card", "Shop any warehouse"],
         "EXECUTIVE", ["$130 a year (US)", "Was $120 until Sept 2024", "About 2% back on purchases", "Reward cap: $1,250 a year"]),
      t="To get through the door, you pay. In the United States, a basic Gold Star membership costs sixty-five dollars a year. The Executive membership costs one hundred and thirty, and gives roughly two percent back on purchases, up to one thousand two hundred and fifty dollars a year. Both prices went up in September 2024, from sixty and one hundred and twenty."),
 dict(v=("stat", "84.1 MILLION", "paying member households", "150.4 million cardholders in total, end of FY2026"),
      t="And a lot of people pay. At the end of financial year 2026, Costco had eighty-four point one million paid memberships. Add the extra household cards, and that is about one hundred and fifty point four million cardholders."),
 dict(v=("stat", "$5.9 BILLION", "in membership fees, FY2026", "Up from $5.3 billion the year before"),
      t="Those fees added up to about five point nine billion dollars in 2026, up from five point three billion the year before. And this money is almost pure profit. Costco does not have to buy anything, stock anything, or ship anything to earn it."),
 dict(v=("bars", "Costco revenue, FY2026", [("Net sales", 297247, "$297.2 bn"), ("Membership fees", 5907, "$5.9 bn")]),
      t="On a chart of revenue, the fees are almost invisible. Net sales were about two hundred and ninety-seven billion dollars. Membership fees were just under six billion. Less than two cents of every revenue dollar."),
 dict(v=("bars", "Where the profit comes from, FY2026", [("Operating income", 11685, "$11.7 bn"), ("Membership fees", 5907, "$5.9 bn"), ("Everything else", 5778, "≈$5.8 bn")]),
      t="But now look at profit. Costco's operating income in 2026 was about eleven point seven billion dollars. Membership fees alone were five point nine billion of that. Roughly half. Selling almost three hundred billion dollars of goods made only about the same amount again."),

 # ---------- CH 3 ----------
 dict(v=("chapter", "3", "The Markup Rule"),
      t="Chapter three. The markup rule. This is the secret that makes the whole machine work."),
 dict(v=("stat", "14%", "maximum markup on regular items", "15% cap on Kirkland Signature items"),
      t="Most shops try to make as much as they can on each product. Costco does the opposite. Under a long-standing company rule, no regular item is marked up more than fourteen percent over cost, and its own Kirkland Signature products no more than fifteen percent. Normal supermarkets often charge far more."),
 dict(v=("quote", "Costco doesn't try to profit from the shopping. It profits from the shopper.", ""),
      t="Think about what that means. Costco is not trying to squeeze profit out of each sale. It sells goods at close to cost, so that the membership feels like an obvious bargain. The low prices are the advertisement. The card is the business."),
 dict(v=("flow", "The Costco loop", ["Low prices", "More members", "More buying power", "Lower costs"], ["attract", "give", "cut"],
         "Lower costs  →  even lower prices  →  the loop starts again", "members"),
      t="And it becomes a loop. Low prices bring in more members. More members means Costco buys in enormous amounts. Buying in enormous amounts lets it push suppliers for lower costs. And lower costs mean even lower prices. Round and round."),
 dict(v=("list", "How Costco keeps costs tiny", ["Fewer than 4,000 products per warehouse", "Huge packs, sold off pallets", "Warehouses of about 148,000 sq ft", "Very little advertising"]),
      t="The rest of the design keeps costs down. A typical Costco carries fewer than four thousand different products, while a big supermarket can carry tens of thousands. Goods sit on pallets, straight from the truck. Each warehouse is around one hundred and forty-eight thousand square feet. And Costco spends very little on advertising."),
 dict(v=("stat", "≈2%", "profit from selling goods", "About $5.8 bn after costs, on $297 bn of sales (FY2026)"),
      t="Put the numbers together. Take out the membership fees, and the business of actually selling goods left Costco only about two cents of operating profit for every dollar of sales. That is razor thin. Without the card, Costco would look like a very ordinary retailer."),

 # ---------- CH 4 ----------
 dict(v=("chapter", "4", "Why People Keep Paying"),
      t="Chapter four. Why people keep paying."),
 dict(v=("pie", "92%", "of US & Canada members renew each year"),
      t="Any business that charges a yearly fee lives or dies on one number: how many people come back. In the United States and Canada, Costco's renewal rate at the end of 2026 was ninety-two point three percent. Worldwide, it was nearly ninety percent."),
 dict(v=("stat", "42.3 MILLION", "Executive members", "Up 9% in a year — they make about three quarters of sales"),
      t="Even better for Costco, more people are paying for the expensive card. Executive members reached forty-two point three million, up more than nine percent in a year. And these top-tier members account for roughly three quarters of all of Costco's sales worldwide."),
 dict(v=("timeline", "1995", "Kirkland Signature is launched"),
      t="One big reason people stay is Costco's own brand. Kirkland Signature was launched in the mid-1990s, named after the town near Seattle where Costco used to have its head office. It covers everything from coffee and batteries to clothing."),
 dict(v=("stat", "$90 BILLION", "Kirkland Signature sales in 2025", "Reported at Costco's 2026 shareholder meeting"),
      t="Today Kirkland is a giant on its own. According to figures shared at Costco's 2026 shareholder meeting, Kirkland Signature products brought in about ninety billion dollars of sales in 2025. That is bigger than many famous consumer brands, and it is a brand you can only buy with a Costco card."),

 # ---------- CH 5 ----------
 dict(v=("chapter", "5", "The $1.50 Hot Dog"),
      t="Chapter five. The one dollar fifty hot dog."),
 dict(v=("stat", "$1.50", "hot dog + soda combo", "Same price since the 1980s"),
      t="Walk past the tills at almost any Costco and you will find the food court. The hot dog and soda combo costs one dollar fifty. It has cost one dollar fifty since the 1980s, through decades of rising prices everywhere else."),
 dict(v=("quote", "If you raise the hot dog, I will kill you. Figure it out.", "Jim Sinegal, Costco co-founder (as retold)"),
      t="According to former chief executive Craig Jelinek, he once went to co-founder Jim Sinegal and said they were losing money on it. Sinegal's answer, as Jelinek later told it, was blunt. Raise the price of the hot dog, and I will kill you. Figure it out."),
 dict(v=("list", "How they figured it out", ["Built its own hot dog plant", "Switched soda suppliers to cut costs", "Sells at huge volume", "Price stays at $1.50"]),
      t="So they did. Costco opened its own hot dog production plant to control the cost. In 2013 it even switched soft drink suppliers to save money on the combo, before switching back in 2025. The price never moved."),
 dict(v=("stat", "245 MILLION", "hot dog combos sold in 2025", "Plus more than 157 million rotisserie chickens"),
      t="And people buy them in staggering numbers. In 2025, Costco sold more than two hundred and forty-five million hot dog combos and over one hundred and fifty-seven million rotisserie chickens. These are not profit makers. They are proof. Every cheap hot dog tells you that your membership is worth it."),

 # ---------- CH 6 ----------
 dict(v=("chapter", "6", "A Machine Still Growing"),
      t="Chapter six. A machine that is still growing."),
 dict(v=("bars", "Costco warehouses, Aug 2026", [("United States", 647, "647"), ("Canada", 115, "115"), ("12 other countries", 177, "177")]),
      t="At the end of August 2026, Costco ran nine hundred and thirty-nine warehouses in fourteen countries. Six hundred and forty-seven are in the United States, one hundred and fifteen in Canada, then Mexico, Japan, Britain, Korea, Australia, Taiwan and more."),
 dict(v=("stat", "774", "Costco gas stations", "Petrol was about 11% of net sales in FY2026"),
      t="Costco even uses fuel the same way it uses hot dogs. At the end of 2026 it ran seven hundred and seventy-four petrol stations, and fuel made up about eleven percent of net sales. Cheap fuel is another reason to drive to Costco, and once you are in the car park, you usually go inside."),
 dict(v=("list", "FY2026 at a glance", ["Net income: $9.2 bn (+14%)", "Comparable sales: +8.4%", "Digital: about 11% of sales", "355,000 employees"]),
      t="The latest year was strong. Net income rose about fourteen percent, to nine point two billion dollars. Sales at existing warehouses grew eight point four percent. Digitally enabled sales, including online orders and delivery, made up about eleven percent of the total. And Costco now employs around three hundred and fifty-five thousand people."),
 dict(v=("stat", "33", "new openings planned for FY2027", "Including 5 relocations"),
      t="And it is not slowing down. Costco plans thirty-three openings in its 2027 financial year, including five relocations. Every new warehouse means thousands more people paying a yearly fee before they buy a single thing."),

 # ---------- OUTRO ----------
 dict(v=("chapter", "", "The Money Machine"),
      t="So let's put the whole machine together."),
 dict(v=("list", "The Costco money machine", ["Members pay a yearly fee", "Goods sold at tiny markups", "Few products, huge volume", "Kirkland & $1.50 hot dogs prove the value", "92% renew → fees roll in again"]),
      t="Members pay a fee every year. Costco sells goods at tiny markups, so the fee feels like a bargain. It carries few products and buys them in huge volumes, keeping costs low. Kirkland and the one dollar fifty hot dog keep proving the value. And more than nine out of ten members renew, so the fees roll in again."),
 dict(v=("quote", "The shopping cart is the bait. The membership card is the business.", ""),
      t="Costco sells hundreds of billions of dollars of stuff. But the real engine is the card at the door, and the promise that you will save more than you paid for it."),
 dict(v=("end", "", ""),
      t="That's the money machine behind Costco. If you want to see how another giant really makes its money, subscribe to Money Machine Files, and tell me in the comments which company we should open next."),
]
