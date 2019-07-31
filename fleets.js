// ==UserScript==
// @name         Fleet Pages
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://s160-en.ogame.gameforge.com/game/index.php?page=fleet*
// @grant        none
// ==/UserScript==

;(function() {
  const getShipAvailability = type =>
    parseInt($(`#button${type} .level`)[0].innerHTML.split("</span>")[1])
  const setShipsToSend = (type, quantity) =>
    ($(`#ship_${type}`)[0].value = quantity)
  setTimeout(() => {
    const parseParams = () =>
      location.search
        .split("?")[1]
        .split("&")
        .reduce((a, c) => {
          const [key, value] = c.split("=")
          a[key] = value
          return a
        }, {})

    const fleetInfo = JSON.parse(localStorage.getItem('AGO_EN_UNI160_104889_Fleet_Current'))
    const params = parseParams()
    const ls = JSON.parse(localStorage.getItem("msgInfo"))
    const targetIndex = ls.findIndex((msg) => msg.attacking === 0)
    const target = ls[targetIndex]
    const setCoord = type => ($(`#${type}`)[0].value = target.coords[type])

    if (params.page === "fleet3") {
      console.log("On Fleet 3, setting mission to Attack and clicking Start")
      ls[targetIndex].attacking = 1
      localStorage.setItem('msgInfo', JSON.stringify(ls))
      $("#missionButton1").click()
      return $("#start").click()
    }

    if (params.page === "fleet2") {
      console.log("On Fleet 2, setting target and clicking continue")
      setCoord("galaxy")
      setCoord("system")
      setCoord("position")
      
      // Make sure Target is set to Planet incase we are attacking from moon
      setTType(1)
      return $("#continue").click()
    }

    if (params.page === "fleet1") {
      console.log("On Fleet 1")
      if (fleetInfo.fleets < fleetInfo.fleetsSlots) {
        const availableSmallCargo = getShipAvailability(202)
        target.ships.am202 <= availableSmallCargo
          ? setShipsToSend(202, target.ships.am202)
          : setShipsToSend(203, target.ships.am203)

        checkShips("shipsChosen")
        $("#continue").click()
      } else {
        localStorage.setItem('fleetStatus', 'attacking')
        location.href = '/game/index.php?page=galaxy'
        return console.log("No Fleet Slots Available.  Stopping for now!")
      }
    }
  }, 2000)
})()
