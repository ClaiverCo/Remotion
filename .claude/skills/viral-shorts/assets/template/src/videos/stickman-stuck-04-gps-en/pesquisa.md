# Fact brief: GPS and the clocks in space (English version)

English version of episode 4 of "Stuck in 2026". The facts and sources are the same as in the Portuguese dossier (`src/videos/stickman-stuck-04-gps/pesquisa.md`), researched on 2026-11-04. Bracketed numbers point to the sources at the end.

**Where and when this applies:** the GPS satellite system (run by the United States) used by phones and car navigators all over the world in the 2020s. Other systems (Galileo, GLONASS, BeiDou) work in a similar way, but the script only talks about "satellites" and "GPS".

**Verification note:** this container could not open the source pages directly (the network policy blocks most sites), so the claims below were checked against search-result excerpts from several independent sources. Re-open the sources before publishing commercially.

## Central question
How does a phone map know exactly where you are?

## How it works, step by step
1. **Satellites with atomic clocks.** Each GPS satellite carries very precise atomic clocks and broadcasts a signal stamped with the exact time it was sent [2][3][4].
2. **Travel time → distance.** The receiver compares the sending time with the arrival time. Multiplying that delay by the speed of light gives the distance to each satellite (D = T × C) [3][4].
3. **Four satellites or more.** Each distance is a sphere around a satellite. With four or more, the spheres meet at one point, and the fourth measurement also corrects the receiver's cheap clock [2][3].
4. **Position and time.** The result is the receiver's position and a very precise time reference [2][3].
5. **Relativity.** By special relativity, the fast-moving satellite clocks would fall behind by about 7 microseconds a day. By general relativity, being farther from Earth's gravity, they would run ahead by about 45. The net result is that they run **about 38 microseconds a day fast** compared with clocks on the ground [1][5].
6. **The correction.** That is why the satellite clocks are set to tick slightly slower before launch, so they keep the right rate in orbit [1].

## What the script uses (and where it comes from)
| Script line | Sources |
|---|---|
| A little blue dot showed exactly where we were | [2][3] (everyday use, simplified on screen) |
| Satellites send signals with the exact time | [2][3][4] |
| The receiver measures how long each one took and works out the distance | [3][4] |
| Those satellite clocks run about 38 microseconds a day fast, because of relativity | [1][5] |
| So they're adjusted before launch | [1] |
| Even a phone map depends on clocks in space | [1][2][3] |

The often-quoted "GPS would drift by more than 10 km a day without the correction" [1][5] is **left out**: one forum source disputes how it is usually explained.

## Fiction, clearly separated
Planet Lumen and the **Central Clock**, Kip, the Chrono-Band, the **time machine** and its request for a "burst of power", and Kip being stuck in 2026 are **fiction**. They are never presented as predictions. Ben (PP-02) is an invented ordinary person. The old car GPS is generic, with no brand.

## Sources
1. Richard Pogge, Ohio State University — "Real-World Relativity: The GPS Navigation System". https://www.astronomy.ohio-state.edu/pogge.1/Ast162/Unit5/gps
2. SparkFun — "GPS Basics". https://learn.sparkfun.com/tutorials/gps-basics
3. University of Alaska Fairbanks, physics — "GPS". https://ffden-2.phys.uaf.edu/104_spring2004.web.dir/Sean_OGuinn/UAF_Web/GPS_pg04.htm
4. GIM International — "GPS: Position, Time and Distance". https://www.gim-international.com/content/article/gps-position-time-and-distance
5. IAPS — "Implications of Relativistic Effects on the Global Positioning System (GPS)". https://iaps.info/2023/03/01/article-of-the-month-march-2023/
