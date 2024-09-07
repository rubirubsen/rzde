class Poker {
    constructor(channel) {
        this.channel = channel;
        this.farben = ['♠️','♥️','♦️','♣️'];
        this.werte = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.pokerPlayers = new Set();
        this.deck = [];
        this.startTime = Date.now();
        this.endTime = this.startTime + 30000;
    }

    kartenErstellen() {
        for (let farbe of this.farben) {
            for (let wert of this.werte) {
                this.deck.push(farbe + wert);
            }
        }
    }
    
    kartenMischen() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    holeFlop() {
        let flop = this.deck.splice(0, 3);
        return {
            flop
        };
    }

    flopCards() {
        let flop = this.deck.splice(0, 3);
        let turn = this.deck.splice(0, 1);
        let river = this.deck.splice(0, 1);
        return {
            flop,
            turn,
            river
        };
    }

    spielerAktion(spieler) {
        // Hier implementieren, wie der Spieler reagieren kann (fold, check, bet)
    }

    evalHand(hand) {
        let werte = hand.map(card => card.slice(1));
        let farben = hand.map(card => card[0]);

        let zaehleWerte = werte.reduce((acc, value) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});

        let isFlush = new Set(farben).size === 1;
        let isStraight = new Set(werte).size === 5 && Math.max(...werte) - Math.min(...werte) === 4;

        let pokerHand = {
            isFlush,
            isStraight,
            zaehleWerte,
            straightFlush: isFlush && isStraight
        };

        return pokerHand;
    }

    pokerSpiel(client, channel) {
        let tableCards = null;
        client.say(channel, `Macht euch bereit`);

        this.kartenErstellen();
        this.kartenMischen();

        for(const player of this.pokerPlayers.values()){
            const spielerKarten = this.deck.splice(0, 2);
            client.say(channel, player + ' hat ' + spielerKarten.join(","));
            tableCards = this.deck.splice(0,3);
        }
        client.say(channel, 'In der Mitte liegen zusätzlich ' + tableCards.join(","));
        
    }
}

export default Poker;
