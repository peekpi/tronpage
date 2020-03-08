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
    return sendTx(tx, 20)
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
        let win1 = CardFormat(CardInfoDecode(eventResult.result['win1']));
        let win2 = CardFormat(CardInfoDecode(eventResult.result['win2']));
        let winValue = BigInt(eventResult.result['total']);
        let benefit = winValue/BigInt(10);
        winValue -= benefit;
        let win1Value = winValue*BigInt(win1.betValue)/(BigInt(win1.betValue)+BigInt(win2.betValue));
        wincards.push({
            benefit: benefit.toString(10),
            start: {card: win1, winValue: win1Value.toString()},
            end: {card: win2, winValue: (winValue - win1Value).toString()}
        });
    });
}