const D = console.log

function vueInit() {
    let cards = []
    let betDisable = false
    let winValue = 100
    let wincards = [{
        benefit: Int(winValue * 0.1),
        start: {
            card: Object.assign({}, {player:1,betNo:2,cardNo:3,betValue:4,isInit:1}),
            winValue: winValue * 0.45
        },
        end: {
            card: Object.assign({}, {player:1,betNo:2,cardNo:3,betValue:4,isInit:1}),
            winValue: winValue * 0.45
        }
    }]
    wincards = []
    vmcards = new Vue({
        el: '#cardsList',
        data: {
            cards: cards,
            wincards: wincards,
            checked: false,
            betDisable: betDisable
        },
        methods: {
            greet: function (e) {
                if (betDisable) return
                betDisable = true
                vmcards.betDisable = true;
                let f = () => {
                    pushcard().then(() => {
                        if (vmcards.checked)
                            f();
                        else {
                            betDisable = false
                            vmcards.betDisable = false;
                        }
                    })
                }
                f()
            }
        }
    });
    contractInit(pushabi.contracts)
    lastInit = 0
    f = () => {
        readCards(vmcards.cards, lastInit, vmcards.$set).then(
            (res) => {
                lastInit = res.lastInit
                if (res.cardsLength < cards.length)
                    vmcards.cards = vmcards.cards.slice(0, res.cardsLength)
                //D(res, vmcards.cards.length)
                setTimeout(f, 3000)
            }
        )
    }
    f()
    watchWinner(vmcards.wincards)
}

window.onload = (e) => {
    if (!(window.tronWeb && window.tronWeb.defaultAddress.base58)) {
        alert("TronLink may not actived")
        return
    }
    if (tronWeb.fullNode.host != "https://api.shasta.trongrid.io") {
        alert("Only support Sahata Testnet")
        return
    }
    D("Yes, catch it:", window.tronWeb.defaultAddress.base58)
    vueInit();
}
