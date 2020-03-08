const Json = JSON.parse;
const Int = parseInt
//const bigInt = tronWeb.BigNumber
//const D = console.info;

function getContract(addr) {
    return tronWeb.contract().at(addr).then(
        (x) => { return x; }
    );
}

function localContract(abi, addr) {
    return tronWeb.contract(Json(abi), addr)
}

function sendTx(txobj, trx = 0, fee = 2, sync = true) {
    return txobj.send({
        feeLimit: tronWeb.toSun(fee),
        shouldPollResponse: sync,
        callValue: tronWeb.toSun(trx),
    });
}
/*
async function winSearch(cards, lastInit, cardsLength, set) {
    let cardmap = []

    for (let i = 0; i <= cardsLength; i++) {
        let n = Int(cards[i].cardNo)
        cardmap[n] = i
    }
    D("cardmap:", lastInit, cardsLength, cardmap)
    let match = 0
    let index = 0
    for (index = lastInit?lastInit-1:0; index < 1024; index++) {
        let cardi = await pushCardDeploy.cards(index).call()
        let decard = CardInfoDecode(cardi)
        D("decard:", index, decard)
        if (Int(decard.isInit) == 0 || (index > 0 && decard.betNo < cards[index - 1].betNo))
            return null
        nzero = (n) => { return (BigInt(10) ** BigInt(n)).toString().slice(1) }
        hexadd = decard.player.slice(2)
        decard.player = tronWeb.address.fromHex("0x" + nzero(hexadd.length - 40) + hexadd);
        if (index < cards.length)
            set(cards, index, decard)
        else
            cards.push(decard)
        match = cardmap[Int(decard.cardNo)]
        if (match != null)
            break;
    }

    let winValue = cards.slice(match, index + 1).reduce((a, b) => a + Int(b.betValue), 0);
    return {
        benefit: winValue * 0.1,
        start: {
            card: Object.assign({}, cards[match]),
            winValue: winValue * 0.45
        },
        end: {
            card: Object.assign({}, cards[index]),
            winValue: winValue * 0.45
        }
    }
}
*/
function CardInfoDecode(en) { en = BigInt(en); return { player: '0x' + (en & BigInt('0xffffffffffffffffffffffffffffffffffffffff')).toString(16), betNo: '0x' + ((en >> BigInt('160')) & BigInt('0xffffffff')).toString(16), betValue: '0x' + ((en >> BigInt('192')) & BigInt('0xffffffff')).toString(16), cardNo: '0x' + ((en >> BigInt('224')) & BigInt('0xff')).toString(16), isInit: '0x' + ((en >> BigInt('232')) & BigInt('0xff')).toString(16) }; }

function CardFormat(card) {
    nzero = (n) => { return (BigInt(10) ** BigInt(n)).toString().slice(1) }
    hexadd = card.player.slice(2)
    card.player = tronWeb.address.fromHex("0x" + nzero(hexadd.length - 40) + hexadd);
    card.isInit = Int(card.isInit)
    return card
}

function contractInit(contracts, cAddress) {
    mainEntryDeploy = localContract(contracts['action.sol:Main'].abi, cAddress.mainEntry)
    pushCardDeploy = localContract(contracts['PushCard.sol:PushCard'].abi, cAddress.pushCard)
}

async function readCards(cards, lastInit, set) {
    let cardsLength = Int(await pushCardDeploy.cardsLength().call())
    if (cardsLength < cards.length) {
        //let win = await winSearch(cards, lastInit, cardsLength, set)
        //if (win) wincards.push(win)
        lastInit = cardsLength < 5 ? 0 : cardsLength - 5
        return { lastInit: lastInit, cardsLength: cardsLength }
    }

    let isInit = false
    for (let i = lastInit; i < cardsLength; i++) {
        //let cardi = await pushCardDeploy.CardView(lastRead).call()
        if (i < cards.length && cards[i].isInit > 0) {
            //D("---=", i, cards[i].isInit, cards[i].isInit>0)
            //continue
        }
        let cardi = await pushCardDeploy.cards(i).call()
        let decard = CardInfoDecode(cardi)

        if (Int(decard.isInit) > 0)
            lastInit = isInit ? lastInit : lastInit + 1;
        else
            isInit = true

        CardFormat(decard)
        if (i < cards.length)
            set(cards, i, decard)
        else
            cards.push(decard)
    }
    return { lastInit: lastInit, cardsLength: cardsLength }
}

function pushcard() {
    let tx = mainEntryDeploy.pushCard(0)
    return sendTx(tx, 10)
}

function FeedHashes(blockno) {
    tronWeb.trx.getBlockByNumber(Int(blockno)).then((block)=>{
        sendTx(mainEntryDeploy.FeedHash(blockno, '0x'+block.blockID))
    })
}

function deal() {
    sendTx(mainEntryDeploy.deal())
}

function watchWinner(wincards) {
    pushCardDeploy.winner().watch((err, eventResult) => {
        if (err) {
            return console.error('Error with "method" event:', err);
        }
        if (eventResult.name != "winner") return;
        win1en = eventResult.result['win1'];
        win2en = eventResult.result['win2'];
        winValue = eventResult.result['total'];
        wincards.push({
            benefit: winValue * 0.1,
            start: {
                card: CardFormat(CardInfoDecode(win1en)),
                winValue: winValue * 0.45
            },
            end: {
                card: CardFormat(CardInfoDecode(win2en)),
                winValue: winValue * 0.45
            }
        });
    });
}