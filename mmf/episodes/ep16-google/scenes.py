# Money Machine Files — Ep 16: How Google Really Makes Money
# Each scene: narration text + visual spec (+ optional photo query). *word* = highlighted caption keyword.

SCENES = [
 # ---------- COLD OPEN ----------
 dict(v=("title", "$402.8 BILLION", "Alphabet's revenue in 2025"),
      t="In 2025, Google's parent company, Alphabet, brought in *four hundred and two point eight billion dollars*. That is more than one billion dollars, every single day."),
 dict(v=("quote", "Google gives almost everything away for free.", ""),
      t="And yet you never pay to search. You do not pay for Maps, for Gmail, or to watch most videos on YouTube. So where does all that money come from? How does Google *really* make money?"),
 dict(v=("brand", "FILE #016  ·  GOOGLE"),
      t="This is the money machine behind Google. Let's open the file."),

 # ---------- CH 1 ----------
 dict(v=("chapter", "1", "Two Students and a Garage"),
      t="Chapter one. Two students and a garage."),
 dict(v=("timeline", "1995", "Larry Page and Sergey Brin meet at Stanford"), photo="university campus sandstone arches",
      t="In 1995, a student named *Sergey Brin* was asked to show a possible new student around Stanford University. That visitor was *Larry Page*. By some accounts, they disagreed about almost everything."),
 dict(v=("quote", "Rank a web page by the links that point to it.", ""),
      t="But a year later they were working together from their dorm rooms. Their idea was simple and powerful: a page is important if many other important pages *link* to it. They first called their search engine *BackRub*, because it read the links pointing back to each page. Other search engines mostly counted words. BackRub counted trust."),
 dict(v=("timeline", "AUGUST 1998", "A $100,000 check from Andy Bechtolsheim"), photo="old desktop computer nineteen nineties",
      t="Then they renamed it Google, a play on a huge number, a one followed by a hundred zeros. In August 1998, Sun Microsystems co-founder Andy Bechtolsheim wrote them a check for *one hundred thousand dollars*."),
 dict(v=("timeline", "SEPT 4, 1998", "Google is incorporated; first office in a Menlo Park garage"), photo="suburban house garage driveway",
      t="On September fourth, 1998, Google was officially founded. Its first office was a garage in Menlo Park, California, rented for about *seventeen hundred dollars* a month from Susan Wojcicki, who later became Google's sixteenth employee."),
 dict(v=("stat", "0 DOLLARS", "what users paid to search", "So how would it ever make money?"), photo="empty office desk keyboard",
      t="Google was fast, clean and loved. But there was one big problem. It made *no money*. Users paid nothing, and the founders did not want flashing banner ads all over the page. Investors kept asking the same question: how will a free website ever pay the bills?"),

 # ---------- CH 2 ----------
 dict(v=("chapter", "2", "The Ad Auction"),
      t="Chapter two. The ad auction."),
 dict(v=("timeline", "OCTOBER 2000", "Google launches AdWords"), photo="laptop search page typing",
      t="In October 2000, Google launched *AdWords*, today called Google Ads. Small text ads appeared next to search results, and they matched exactly what you were looking for."),
 dict(v=("flow", "How a search ad makes money", ["Advertiser", "Google", "You"], ["bids + pays per click", "free answers"],
         "You search for free  →  advertisers pay only when you click", "Google"),
      t="Here is the clever part. Advertisers bid in an *auction* for each search word, like running shoes or flights to Dubai. But the highest bid does not always win. Google also judges how useful the ad is. And the advertiser pays only when someone *clicks*."),
 dict(v=("quote", "The user tells Google exactly what they want.", ""),
      t="Think about why this is so valuable. A television ad hopes you might want a car someday. A search ad appears at the exact moment you type, I want a car. That is the most valuable moment in all of advertising. And because each click is tiny, millions of small businesses could afford to join, not just giant brands."),
 dict(v=("timeline", "AUG 19, 2004", "IPO at $85 a share, raising $1.67 billion"), photo="stock exchange trading screen numbers",
      t="The machine worked. Before going public, Google made one point three five billion dollars of revenue in just six months. On August nineteenth, 2004, it listed on the stock market at *eighty-five dollars* a share, raising about one point six seven billion dollars."),

 # ---------- CH 3 ----------
 dict(v=("chapter", "3", "Buying the Roads"),
      t="Chapter three. Buying the roads."),
 dict(v=("timeline", "2005", "Google buys Android for about $50 million"), photo="smartphone on wooden table",
      t="Google knew people would soon search on phones. In 2005 it quietly bought a small start-up called *Android* for a reported fifty million dollars. Then it gave the software away free to phone makers. Today Android runs on billions of phones, with Google search built in."),
 dict(v=("timeline", "OCTOBER 2006", "Google buys YouTube for $1.65 billion in stock"), photo="video camera filming",
      t="In October 2006, Google bought a young video site called *YouTube* for one point six five billion dollars in stock. Many people thought it was far too much money for a site full of home videos."),
 dict(v=("stat", "$60 BILLION+", "YouTube revenue in 2025", "Ads plus subscriptions"), photo="person watching video tablet",
      t="They were wrong. In 2025, YouTube made more than *sixty billion dollars* from ads and subscriptions. In the third quarter of 2026 alone, YouTube ads brought in eleven point two billion dollars."),
 dict(v=("timeline", "AUG 10, 2015", "Google reorganizes under a new parent: Alphabet"), photo="glass office building campus",
      t="Add Chrome, Gmail and Maps, and Google owned many of the roads people use to reach the internet. In August 2015, the company created a new parent called *Alphabet*. Sundar Pichai became the boss of Google, and later of Alphabet too."),

 # ---------- CH 4 ----------
 dict(v=("chapter", "4", "Where the Money Comes From"),
      t="Chapter four. Where the money comes from."),
 dict(v=("bars", "Alphabet revenue, Q3 2026", [("Search & other", 63.4, "$63.4 bn"), ("Google Cloud", 30.7, "$30.7 bn"), ("Subscriptions & devices", 14.3, "$14.3 bn"), ("YouTube ads", 11.2, "$11.2 bn")]),
      t="Look at the last quarter Alphabet reported, July to September 2026. Revenue was *one hundred and twenty-seven point six billion dollars*, up twenty-five percent. Search brought in sixty-three point four billion. The cloud, thirty point seven. Subscriptions and devices, fourteen point three. YouTube ads, eleven point two. And ads on other websites, seven and a half. Notice that search is still the biggest bar by far, almost twenty-five years after AdWords began."),
 dict(v=("pie", "64%", "of Alphabet's Q3 2026 revenue came from advertising"), photo="digital advertising billboard city",
      t="Put all the ads together and you get eighty-two billion dollars in one quarter. That is about *sixty-four percent* of everything Alphabet earns. Search alone is about half of the whole company."),
 dict(v=("stat", "$14.3 BILLION", "subscriptions, platforms and devices, Q3 2026", "YouTube Premium, Google One, Pixel, Play"), photo="smartphone apps screen",
      t="The rest comes from things you pay for directly: *YouTube Premium* and Music, extra Google storage, the Play app store, and Pixel phones. YouTube Music and Premium have passed one hundred and fifty million subscribers, including trials."),
 dict(v=("compare", "GOOGLE SERVICES", ["$96.3 bn revenue", "Search, YouTube, Android, Play", "$39.2 bn operating profit"], "GOOGLE CLOUD", ["$30.7 bn revenue", "Up 103% in a year", "$11.1 bn operating profit"]),
      t="In the quarter, Google's consumer services made thirty-nine point two billion dollars of operating profit. That is still the main engine. But look at the cloud. Its sales *more than doubled* in a year, and its profit jumped from three point six billion to eleven point one billion."),

 # ---------- CH 5 ----------
 dict(v=("chapter", "5", "The Secret: Paying to Be the Default"),
      t="Chapter five. The secret: paying to be the default."),
 dict(v=("quote", "Most people never change the search engine on their phone.", ""),
      t="Here is something most users never think about. When you open a new phone or a browser, the search box is already set. And almost nobody changes it. So Google pays to be that *default* choice."),
 dict(v=("stat", "$20 BILLION", "Google's payments to Apple in 2022", "To be Safari's default search engine"), photo="smartphone browser close up",
      t="Court documents showed that in 2022, Google paid Apple about *twenty billion dollars*, mainly to be the default search engine in Safari on iPhones. That is one company paying another just to stay in the box. Why pay so much? Because every search on an iPhone is a chance to show an ad, and those clicks are worth far more than twenty billion dollars."),
 dict(v=("pie", "20%", "of Google's ad revenue paid out as traffic costs, Q3 2026"), photo="web browser on laptop",
      t="Google calls these payments *traffic acquisition costs*. In the third quarter of 2026, they were sixteen point four billion dollars, about one dollar in every five that Google earned from ads. It pays phone makers, browsers and website partners to send searches its way."),
 dict(v=("timeline", "SEPT 2, 2025", "Judge: Google keeps Chrome, but exclusive deals are banned"), photo="courthouse columns",
      t="This system has a cost. A US judge ruled that Google had broken antitrust law in search. On September second, 2025, the judge decided Google could *keep Chrome* and Android, but banned exclusive deals and ordered Google to share some search data with rivals. Google can still pay to be the default, it just cannot lock partners in."),

 # ---------- CH 6 ----------
 dict(v=("chapter", "6", "The AI Bet"),
      t="Chapter six. The AI bet."),
 dict(v=("quote", "If AI answers the question, who clicks on the ad?", ""),
      t="Then came the biggest threat in Google's history: *AI chatbots*. If a robot answers your question directly, you may never click on a search ad. Many people said this could break the money machine. After all, the whole business is built on people clicking links."),
 dict(v=("stat", "1 BILLION", "Gemini app users", "Reported in Q3 2026"), photo="person using phone chat app",
      t="Google's answer was its own AI, called *Gemini*. By the third quarter of 2026, the Gemini app had reached one billion users. Google's AI models were processing nearly thirty-two billion tokens, or pieces of text, every minute."),
 dict(v=("stat", "+103%", "Google Cloud revenue growth, Q3 2026", "$30.7 bn in one quarter"), photo="data center server racks blue",
      t="And AI turned the cloud into a rocket. Companies rent Google's computers and its own AI chips, called *TPUs*, to build their own AI. Cloud revenue grew one hundred and three percent, to thirty point seven billion dollars in a single quarter."),
 dict(v=("stat", "$514 BILLION", "Google Cloud backlog, end of Q2 2026", "Signed deals not yet delivered"), photo="computer chips circuit board",
      t="Even more is already signed. At the end of June 2026, Google Cloud had a backlog of *five hundred and fourteen billion dollars* in contracts that customers have committed to but not yet used."),
 dict(v=("compare", "MONEY IN", ["$42.3 bn operating cash", "Q3 2026", "From running the business"], "MONEY OUT", ["$51.4 bn on equipment", "Same quarter", "Free cash flow: -$9.1 bn"]),
      t="But building this costs a fortune. In the third quarter of 2026, Alphabet spent fifty-one point four billion dollars on data centers and equipment. That was more than its operations brought in, so its free cash flow was *minus nine billion dollars*."),
 dict(v=("stat", "$195–205 BN", "Alphabet's planned capital spending in 2026", "In 2025 it was $91.4 billion"), photo="construction cranes large building",
      t="For the full year 2026, Alphabet plans to spend *one hundred and ninety-five to two hundred and five billion dollars*, more than double the ninety-one billion it spent in 2025. And reports say spending in 2027 could be even higher."),

 # ---------- OUTRO ----------
 dict(v=("chapter", "", "The Money Machine"),
      t="So let's put the whole machine together."),
 dict(v=("list", "The Google money machine", ["Give search, Maps and Gmail away free", "Sell ads at the moment people ask", "Pay to be the default everywhere", "Own the roads: Android, Chrome, YouTube", "Rent AI computers through the cloud"]),
      t="Give away search, Maps and Gmail for free. Sell ads at the exact moment people ask for something. Pay to be the default everywhere. Own the roads, like Android, Chrome and YouTube. And now, rent out AI computers through the cloud."),
 dict(v=("quote", "You are not Google's customer. Your question is the product.", ""),
      t="It started with two students and a garage. Today Google earns more than a billion dollars a day, mostly from the questions we type. The big question now: can Google keep its ad machine running while AI changes how we search?"),
 dict(v=("end", "", ""),
      t="That's the money machine behind Google. If you want to see how another giant really makes its money, subscribe to Money Machine Files, and tell me in the comments which company we should open next."),
]
