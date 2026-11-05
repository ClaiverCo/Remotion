# Fact brief: the quartz watch

Research done on 2026-11-04 following `references/pesquisa.md` (viral-shorts) and the "present-day facts" step of the Stickman series. Bracketed numbers point to the sources at the end.

This is **episode 1 of the 6-part arc "Stuck in 2026"**. Only the quartz explanation (clips 4 and 5) is a present-day fact. The Central Clock, the portals and Kip getting stuck are fiction.

**Where and when this applies:** ordinary battery-powered analog quartz wristwatches (watches with hands) sold all over the world in the 2020s. Digital watches use the same crystal and divider but show the time on a display instead of moving hands; the script only shows an analog watch.

**Verification note:** this container could not open the source pages directly (the network policy blocked nist.gov and the manufacturers' sites), so the claims below were checked against search-result excerpts from several independent sources. Re-open the sources before publishing commercially.

## Central question
How does an ordinary wristwatch from the 2020s know exactly how long one second is?

## How it works, step by step
1. **Battery.** A small button battery powers an electronic circuit inside the watch [2][3][4].
2. **Quartz tuning fork.** The timekeeping part is a tiny piece of quartz cut into the shape of a tuning fork [1][2][3].
3. **Piezoelectric effect.** Quartz is piezoelectric: a voltage makes it flex, and flexing it makes a small voltage. The circuit uses this to keep the crystal vibrating, like a tuning fork that never stops ringing [2][3][5].
4. **32,768 vibrations per second.** The watch crystal is cut so that it vibrates 32,768 times per second (32,768 Hz) [1][2][3][4][5].
5. **Halving fifteen times.** 32,768 is 2 multiplied by itself 15 times (2¹⁵). A divider chip (a chain of 15 divide-by-two stages) halves the count again and again until one pulse per second is left [1][4][5].
6. **The tick.** Each one-second pulse drives a tiny stepping motor that moves the second hand one step through a set of gears [1][4][5].

## Surprising facts (hook candidates)
- 32,768 Hz is above the upper limit of human hearing (about 20,000 Hz), so the crystal never makes an audible hum [1][4].
- The number was chosen *because* it can be halved down to exactly 1: simple divide-by-two circuits were the cheapest to build [1][4].

## Myths and mistakes
- "The battery makes the time." No: the battery only powers the circuit; the crystal's vibration is the reference that keeps time [2][3].
- Accuracy and history details (who made the first quartz watch, how many seconds per month it drifts) differ between sources, so **the script leaves them out**.

## What the script uses (and how)
| Script claim | Sources |
|---|---|
| Inside the watch, a tiny battery's voltage makes a quartz tuning fork vibrate | [2][3][5] |
| It vibrates 32,768 times every second | [1][2][3][4][5] |
| A chip cuts that in half fifteen times in a row | [1][4][5] |
| Leaving one pulse a second to move the hand | [1][4][5] |
| Ben's watch hand ticked once every second | [1][4] (ordinary analog quartz watch) |
| The crystal ticked inside an everyday watch | [1][2] (quartz watches are common and inexpensive) |

## Fiction, clearly separated
Planet Lumen, Kip, the Chrono-Band, the Old Layers, **the Central Clock of Lumen** (which keeps doors, platforms and portals in time and runs on the same kind of crystal), the portal overload, the cracked Chrono-Band and Kip being stuck in 2026 are **fiction**. They are never presented as predictions. Ben (PP-02) is an invented ordinary person, not a real individual.

## Sources
1. Wikipedia — "Quartz clock" (32,768 Hz = 2¹⁵; 15-bit binary counter overflows once per second; Lavet-type stepping motor; above human hearing; cheap counters). https://en.wikipedia.org/wiki/Quartz_clock
2. ASM International — "How a Quartz Watch Works" (battery voltage drives a tiny quartz tuning fork at 32,768 times per second; the circuit counts vibrations and makes one pulse per second; piezoelectric effect works both ways). https://www.asminternational.org/edfas/videos/-/journal_content/56/10192/25173231/VIDEO/
3. Exquisite Timepieces — "How Do Quartz Watches Work?" (battery, tuning-fork crystal, 32,768 Hz, pulses drive the motor). https://www.exquisitetimepieces.com/blog/how-do-quartz-watches-work/
4. Sciencing — "Quartz movement watches" (frequency and division down to one pulse per second). https://sciencing.com/quartz-movement-watches-6606742
5. F. Walls, NIST Time and Frequency Division — chapter on quartz tuning forks (32,768 Hz extensional mode used in watches), via search excerpt. https://tf.nist.gov/general/pdf/617.pdf
