# Systek says
For å få spillet til å fungere må det kobles til en PC, og følgende drivere må være installert:

https://meshtastic.org/docs/getting-started/serial-drivers/esp32/

Pass på at du installerer driverne for ditt operativsystem.

Når driverne er installert kan du koble spillet til datamaskinen.


# Scoreboard

Scoreboardet er tilgjengelig her: [Scoreboard](https://aleksag.github.io/systek-says-scoreboard/)
## Oppstart

Når spillet er koblet til og scoreboardet er åpnet i nettleseren din (skal fungere i Google Chrome) så trykker du på knappen "Connect to game"
Da får du opp en liste over tilgjengelige seriellporter, velg den som heter noe a-la "CP2102 USB to UART" og trykk ok.

Da er du klar til å starte spillet. 

## Starte spillet

Når en spiller ønsker å spille, registrerer du navn, telefonnummer og epost ved å trykke new player.

Da vil denne spilleren kunne spille så mange runder den vil og dersom poengsummen blir bedre så blir det oppdatert på lista.

## Magic stuff
Hvis noe skulle skje, så kan man trykke på "Magic stuff" knappen i høyrehjørnet. Da vil man kunne redigere listen med scores (passordbeskyttet, men passordet fås fra Aleksander)

Man kan også eksportere scores, dette kan være lurt å gjøre en gang eller to i løpet av dagen for å være sikker på at man ikke mister noe da highscoren er lagret i local-storage i nettleseren.

For å importere fra en eksportert csv, kopierer du bare ut innholdet i csv-filen du lastet ned, trykker på import csv, limer inn og laster innholdet med ctrl+enter.

## Feilsøking
Dersom noe skulle oppstå og spillet ikke svarer, så kan man prøve en forced refresh i nettleseren (ctrl+F5). Og prøve å koble til på nytt.
Dersom dette skulle feile, kan man koble spillet fra USB-porten, vente 2 sekunder, koble det til igjen, og så refreshe nettsida, for så å trykke connect igjen.

Hvis det skulle feile så kan man ringe Aleksander eller spørre på slack.
