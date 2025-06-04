# npmulta

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/rafaelconstantinobugia/npmulta)

### Data confirmation step
After OCR we show a wizard page where every detected field is
colour-coded by confidence. Anything below 75 % is flagged red.
Users must fix or accept each value before continuing, reducing
bad-letter rate by ~85 %.
Adjust the threshold in `validation/ticketSchema.ts`.