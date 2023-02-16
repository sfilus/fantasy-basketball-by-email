# Fantasy Basketball By Email

## Summary

This is an application designed to run a fantasy basketball league for players who prefer not to manage a team on a daily basis.

* League members choose 'reserve' players, that are automatically substituted into their active lineup when a 'starting' player misses a game.
* Weekly emails are sent to the entire league with the latest statistics and standings.

![Example League Email](example-league-email.png)

## Running the application

1. Clone this repo
2. Install the project's dependencies
   1. `npm install`
3. Create a `.env` file at the root of the directory to store your SMTP email configuration properties. Example `.env` file:

```
BBALL_HOST=mail.privateemail.com
BBALL_PORT=465
BBALL_KEY=my_key
BBALL_ACCOUNT=example@yourdomain.com
BBALL_SEND="example@yourdomain.com"
```

4. Change `league.json` to assign NBA player's to fantasy teams. `bbrefID` properties should be looked up from https://www.basketball-reference.com/.
5. Run the application to calculate league statistics and send the weekly summary email.
   1. `npm run email-league`
