# Warhammer 40k Dice Roller

A Symbiote to help calculate Warhammer 40k rolls in TaleSpire. This Symbiote
was based off of the 10th Edition Warhammer 40k Ruleset, and may still be mising
features as it's my first foray into 40k.

# Loading into TaleSpire

Place the `warhammer40k_roller` folder into `%AppData%\..\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\`.
Upon loading TaleSpire's Symbiotes, you will see one labeled Warhammer 40k Dice Roller.

# Features & Usage

The Symbiote itself functions to roll a bunch of d6's and help calculate the success of the roll. It has the following
capabilities to help aid that:

- Set the type of roll. This is used only for in In-Chat reporting and has no bearing of what you can or cannot roll.
I didn't want to code rules.
- Set how many d6 you'd like to roll. Max of 40 (TaleSpire Limit).
- Set a target value. This is the value your dice (after modifiers) have to hit or exceed to count as successes.
- Set a modifier. This will apply to each die in the roll individually.
- Turn on Exploding Die. You can set die to explode on a particular number and above (but not 1). You can also set them up
to explode only once (default) or to Chain.
- Treat all d6 as d3
- Validation on any field update. If the bounds I've put in aren't realistic to what's possible, let me know or open a PR!
- When you start the roll, it will send a message in chat with a summary of what you are about to roll.
- After the roll is done, it puts up to three Results Tables on the Symbiote. These are also reported out in TaleSpire's chat.

## Results Tables

The following three tables show up in Symbiote after a roll, and an approximation of them are reported into Chat (as chat
does not support tables).

In the examples below, I rolled `20d6` with a Modifier of `+1` and a Target Value of `3`.

### Total Results

This table will use the Target Value and the Die Roll to see what counts as a "Success" or a "Failure". It counts natural
1's and 6's as Auto Fail and Crit separately. It also totals all Success + Crits.

| Outcome         | Count |
|-----------------|-------|
| Auto Fail (1)   | 3     |
| Below Target    | 0     |
| Met/Exceeded    | 15    |
| Auto Crit (6)   | 2     |
| Total Successes | 17    |

### Die Counts

This table gives you a breakdown of what all the die you rolled actually rolled. Handy for if you have a rule that 
triggers on particular numbers.

| Die Face | Count |
|----------|-------|
| 1        | 3     |
| 2        | 1     |
| 3        | 5     |
| 4        | 4     |
| 5        | 5     |
| 6        | 2     |

### Modified Counts

This table will only show up if you used a non-zero modifier. It's a replica of the Die Counts table, just with the
modified results shown. Figured it might be handy ¯\_(ツ)_/¯

| Roll Result | Count |
|-------------|-------|
| 2           | 3     |
| 3           | 1     |
| 4           | 5     |
| 5           | 4     |
| 6           | 5     |
| 7           | 2     |

# Screenshots

<img src="example_images\interface.png"  width="600">
<img src="example_images\message.png"  width="500">
<img src="example_images\exploding_message.png"  width="500">
<img src="example_images\after_exploding_roll.png"  width="600">

