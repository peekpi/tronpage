const D = console.log
const JsonFile = (url)=>fetch(url).then(e=>e.json())

async function vueInit() {
    let cards = []
    let betDisable = false
    let winValue = 100
    let wincards = []

    pushABI = await JsonFile("PushCard.sol.json")
    cAddress = await JsonFile("Contract.json")
    contractInit(pushABI.contracts, cAddress)
    vmcards = new Vue({
        el: '#cardsList',
        data: {
            player: tronWeb.defaultAddress.base58,
            entryAddress: cAddress.mainEntry,
            cardAddress: cAddress.pushCard,
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
                    }).catch((err)=>{
                        D("betErr:", err)
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
    vmcards.$el.style.display = ""
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
        ).catch(
            (err) => {
                D("readError:", err);
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
