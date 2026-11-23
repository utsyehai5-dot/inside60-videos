# Money Machine Files — Ep 20: How Sony Really Makes Money
# Each scene: narration text + visual spec (+ optional photo query). *word* = highlighted caption keyword.

SCENES = [
 # ---------- COLD OPEN ----------
 dict(v=("title", "-35%  /  +83%", "PS5 sales fell. PlayStation profit soared."),
      t="Between July and September 2026, Sony shipped about *two point six million* PlayStation 5 consoles. That was down from around four million a year earlier. And yet, in the same three months, profit at its PlayStation business jumped by *eighty-three percent*."),
 dict(v=("quote", "Fewer consoles. Far more profit.", ""),
      t="Fewer machines sold, and far more money made. The company famous for the Walkman and the TV no longer makes most of its money from gadgets. So how does Sony *really* make money?"),
 dict(v=("brand", "FILE #020  ·  SONY"),
      t="This is the money machine behind Sony. Let's open the file."),

 # ---------- CH 1 ----------
 dict(v=("chapter", "1", "A Rice Cooker That Failed"),
      t="Chapter one. A rice cooker that failed."),
 dict(v=("timeline", "MAY 7, 1946", "Tokyo Tsushin Kogyo is founded in bomb-damaged Tokyo"), photo="tokyo old building 1940s street",
      t="On May seventh, 1946, less than a year after the war ended, two engineers started a company in a bombed-out building in *Tokyo*. *Masaru Ibuka* and *Akio Morita* called it Tokyo Tsushin Kogyo, or Tokyo Telecommunications Engineering."),
 dict(v=("stat", "190,000 YEN", "starting capital in 1946", "About 20 employees"), photo="vintage radio repair workbench",
      t="They began with about *one hundred and ninety thousand yen* and around twenty people. To pay the bills, they repaired radios and built small radio parts. It was not glamorous, but it kept the lights on."),
 dict(v=("compare", "RICE COOKER", ["Wooden tub", "uneven rice", "Flop"], "RADIO REPAIRS", ["Steady work", "real customers", "Survival"]),
      t="Their first own consumer product was an electric *rice cooker*. It was a wooden tub with metal strips inside, and it never cooked rice evenly. It sold poorly. Sony's first big idea was a *flop*."),
 dict(v=("timeline", "1950", "Japan's first tape recorder"), photo="vintage reel to reel tape recorder",
      t="In 1950 they built the first tape recorder designed in Japan. It also sold poorly at first. But the founders learned something important. Great engineering is not enough. You have to *create the need*."),

 # ---------- CH 2 ----------
 dict(v=("chapter", "2", "Small Is Beautiful"),
      t="Chapter two. Small is beautiful."),
 dict(v=("timeline", "1953", "Licence for the transistor, from Western Electric"), photo="old transistor electronic components",
      t="In 1953, Morita went to America and signed a deal with *Western Electric* to use the *transistor*, the tiny part invented at Bell Labs. Many experts thought it was only useful for hearing aids. Ibuka wanted to put it into radios."),
 dict(v=("timeline", "1957", "The TR-63: a shirt-pocket transistor radio"),
      t="In 1957 they launched the *TR-63*, a cheap transistor radio small enough for a shirt pocket. It became a major hit, especially in America. Small, portable and personal. That idea would make the company famous."),
 dict(v=("quote", "SONY = sonus, the Latin word for sound", "Official company name from January 1958"),
      t="They also needed a name the world could say. In January 1958 the company officially became *Sony*, from sonus, the Latin word for sound. Not a Japanese name, but an international one."),
 dict(v=("timeline", "1968", "The first Trinitron colour TV ships"),
      t="Then came the *Trinitron* colour TV in 1968, famous for its sharp, bright picture. Sony TVs became a *premium* product around the world."),
 dict(v=("stat", "HUNDREDS OF MILLIONS", "Walkman players sold over the years", "Launched in 1979"), photo="cassette walkman headphones",
      t="And in 1979, the *Walkman*. A tape player you could carry, with light headphones. Over the years it sold *hundreds of millions* of units. Music became something you take with you."),

 # ---------- CH 3 ----------
 dict(v=("chapter", "3", "Hardware Needs Software"),
      t="Chapter three. Hardware needs software."),
 dict(v=("compare", "BETAMAX", ["Sony's format", "launched 1975", "Lost"], "VHS", ["Rival format", "more films", "Won"]),
      t="Sony also had a painful lesson. In 1975 it launched *Betamax*, its own video tape format. Rivals backed *VHS*, and more films came out on VHS. Betamax lost, and in 1988 Sony started selling VHS machines itself."),
 dict(v=("timeline", "1982", "The first CD player, made with Philips"),
      t="The lesson stuck. In 1982, Sony brought out the first *CD player*, developed together with Philips, so the format had friends from day one. Sony began to think: if you own the content, your machines win."),
 dict(v=("bars", "Sony's Hollywood shopping spree", [("CBS Records, 1988", 2.0, "$2.0 bn"), ("Columbia Pictures, 1989", 3.4, "$3.4 bn")]),
      t="So it went shopping. In 1988 Sony completed the purchase of *CBS Records*, for about two billion dollars. In 1989 it agreed to buy *Columbia Pictures* for about three point four billion dollars, the largest purchase of an American company by a Japanese firm at the time."),
 dict(v=("flow", "The Sony idea", ["Sony content", "Sony devices", "Fans"], ["music & films", "play it all"],
         "Own the songs and the films  →  the machines that play them sell better", "Sony"),
      t="The idea was simple. Sony would make the *devices*, and also own the *songs and films* people played on them. Many people called it a mistake back then. Today, that content is the heart of the company."),

 # ---------- CH 4 ----------
 dict(v=("chapter", "4", "Revenge of the PlayStation"),
      t="Chapter four. Revenge of the PlayStation."),
 dict(v=("timeline", "JANUARY 1991", "Nintendo drops Sony for Philips, one day after Sony's announcement"),
      t="Years earlier, a Sony engineer named *Ken Kutaragi* worked with Nintendo on a CD add-on for the Super Nintendo. Then, at a big trade show in 1991, just one day after Sony announced the project, Nintendo revealed a deal with *Philips* instead."),
 dict(v=("timeline", "DECEMBER 3, 1994", "PlayStation launches in Japan"),
      t="Sony decided to build its own console. On December third, 1994, the *PlayStation* went on sale in Japan. Its games came on *CDs*, not cartridges."),
 dict(v=("stat", "100 MILLION+", "original PlayStation consoles sold", "Sold worldwide"),
      t="It sold more than *one hundred million* consoles. The rejected partner had become the market leader. And Sony learned the real secret of the console business."),
 dict(v=("flow", "The razor and blades", ["Console", "Games & PS Plus", "Sony"], ["gets players in", "every sale takes a cut"],
         "The box gets you in the door  →  the games and subscriptions pay", "Sony"),
      t="The console is the *razor*. The games are the *blades*. The box gets players in the door. Much of the money comes later, from every game sold in its store and every *PS Plus* subscription."),

 # ---------- CH 5 ----------
 dict(v=("chapter", "5", "Where the Money Comes From"),
      t="Chapter five. Where the money comes from."),
 dict(v=("stat", "12.48 TRILLION YEN", "Sony sales, year to March 2026", "About $83 billion. Operating income: 1.45 trillion yen"), photo="tokyo skyline night",
      t="In the year to March 2026, Sony had sales of about *twelve point five trillion yen*, around eighty-three billion dollars. Its operating income was one point four five trillion yen, up thirteen percent."),
 dict(v=("bars", "Sony sales by segment, FY2025 (trillion yen)", [("Games & network", 4.69, "4.69"), ("Entertainment tech", 2.26, "2.26"), ("Image sensors", 2.15, "2.15"), ("Music", 2.12, "2.12"), ("Pictures", 1.50, "1.50")]),
      t="Here is the split. *Games and network services*, four point seven trillion yen. TVs, cameras and audio, two point three. Image sensors, two point two. *Music*, two point one. And films and TV shows, one point five trillion."),
 dict(v=("pie", "67%", "of Sony sales: games, music and films (FY2025)"), photo="concert stage lights crowd",
      t="Add up games, music and pictures, and you get about *two thirds* of all Sony sales. The Walkman company has become an *entertainment* company."),
 dict(v=("compare", "MUSIC", ["2.12 tn yen sales", "447 bn yen", "operating income"], "TVs, CAMERAS, AUDIO", ["2.26 tn yen sales", "159 bn yen", "operating income"]),
      t="And look at the profit. *Music* made four hundred and forty-seven billion yen of operating income, with a little help from one-off gains. The TV, camera and audio business, with even more sales, made only about one hundred and fifty-nine billion."),
 dict(v=("compare", "A SONG", ["Made once", "streamed again and again", "Keeps paying"], "A TV", ["Made every time", "sold once in a shop", "Fierce rivals"]),
      t="Why? A song is made once and then earns money *again and again*, every time it is streamed, played on the radio or used in a film. A TV is sold once, in a shop, against fierce rivals. Sony moved its money towards the things that keep paying."),
 dict(v=("timeline", "OCTOBER 1, 2025", "Sony spins off its financial services business"), photo="office building glass modern",
      t="Sony even let go of a big piece of its past. On October first, 2025, it spun off *Sony Financial Group*, its insurance and banking arm, as a separate listed company. What was left is focused on *entertainment* and the technology behind it."),

 # ---------- CH 6 ----------
 dict(v=("chapter", "6", "The Hidden Eyes"),
      t="Chapter six. The hidden eyes."),
 dict(v=("stat", "53.6%", "of the world image sensor market (2025)", "Nikkei. Next: OmniVision 13.4%, Samsung 13.2%"), photo="smartphone camera lens close up",
      t="Here is the part most people never see. Sony makes the *image sensors*, the tiny chips that act as the eyes of a camera. According to Nikkei, Sony held about *fifty-three point six percent* of the world image sensor market in 2025, far ahead of anyone else."),
 dict(v=("flow", "The camera machine", ["Sony sensors", "Phone makers", "You"], ["inside many phone cameras", "every photo you take"],
         "Many rival phones carry a Sony sensor inside", "Sony"),
      t="That means many phones, including rival brands, carry a Sony sensor inside their cameras. Like Samsung with memory chips, Sony gets paid even when you buy someone else's phone. In the year to March 2026, this sensor business had sales of about two point two trillion yen, and earned about *three hundred and fifty-seven billion yen* of operating income."),

 # ---------- CH 7 ----------
 dict(v=("chapter", "7", "The Newest Numbers"),
      t="Chapter seven. The newest numbers."),
 dict(v=("compare", "JULY–SEPT 2025", ["3.11 tn yen", "sales", "429 bn yen operating income"], "JULY–SEPT 2026", ["3.43 tn yen", "sales", "622 bn yen operating income"]),
      t="Now the newest numbers. From July to September 2026, Sony's sales rose ten percent to three point four trillion yen. Operating income jumped *forty-five percent*, to about six hundred and twenty-two billion yen."),
 dict(v=("bars", "Operating income, July–Sept 2026 (billion yen)", [("Games & network", 220.1, "220"), ("Image sensors", 154.6, "155"), ("Music", 122.8, "123"), ("Pictures", 92.6, "93"), ("Entertainment tech", 64.1, "64")]),
      t="Games and network services earned two hundred and twenty billion yen. Image sensors, one hundred and fifty-five. Music, one hundred and twenty-three. Pictures, ninety-three, helped by a huge *Spider-Man* film. And TVs, cameras and audio, sixty-four."),
 dict(v=("stat", "644 BILLION YEN", "PlayStation digital games, Jul–Sep 2026", "Hardware: about 220 billion yen"), photo="gamer playing video game dark room",
      t="Inside PlayStation, look where the money is. Digital games and add-ons brought in about *six hundred and forty-four billion yen* in the quarter. Console hardware, about two hundred and twenty billion. Network services like PS Plus, about two hundred and eighteen billion."),
 dict(v=("stat", "127 MILLION", "PlayStation monthly active users", "September 2026, up from 119 million a year earlier"), photo="game controller neon light",
      t="Behind that are about *one hundred and twenty-seven million* monthly active users. Part of the eighty-three percent jump came from one-off costs a year earlier. Without them, profit still rose around twenty-nine percent. The machine is the *network*, not the box."),
 dict(v=("quote", "Sony raised its full-year profit forecast to 1.87 trillion yen.", "November 2026"),
      t="Sony now expects an operating income of about *one point eight seven trillion yen* for the full year. But there are risks. Its finance chief warned that some early profit came from one-off tariff refunds and demand that arrived early. And the next console, and the next hit game, are never guaranteed."),

 # ---------- OUTRO ----------
 dict(v=("chapter", "", "The Money Machine"),
      t="So let's put the whole machine together."),
 dict(v=("list", "The Sony money machine", ["Sell PlayStations, earn on every game", "Own songs that earn again and again", "Make films and TV shows", "Sell the eyes inside other phones"]),
      t="Sell the PlayStation, then earn on every game and every subscription. Own a huge catalogue of *songs* that pay again and again. Make films and TV shows. And sell the *eyes* inside other companies' phones."),
 dict(v=("quote", "Sony started with a rice cooker that failed. Now it sells fun, again and again.", ""),
      t="It started in a bombed-out building with a rice cooker that could not cook rice. Today, Sony earns most of its money from games, music and films. Fewer gadgets, more fans. The big question: can the next PlayStation keep the machine running?"),
 dict(v=("end", "", ""),
      t="That's the money machine behind Sony. If you want to see how another giant really makes its money, subscribe to Money Machine Files, and tell me in the comments which company we should open next."),
]
