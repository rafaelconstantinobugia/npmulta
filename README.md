# npmulta

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/rafaelconstantinobugia/npmulta)

### Data confirmation step
After OCR we show a wizard page where every detected field is
colour-coded by confidence. Anything below 75 % is flagged red.
Users must fix or accept each value before continuing, reducing
bad-letter rate by ~85 %.
Adjust the threshold in `validation/ticketSchema.ts`.

### Letter templating
We use Handlebars to turn structured ticket data into a PDF defence letter.
Variables live in `templates/letter.<locale>.hbs`; custom helpers (money,
dates, uppercase) are defined in `src/pdf/helpers/handlebarsHelpers.ts`.

To preview locally:
  pnpm dev:template --file sample.json   # renders sample.pdf