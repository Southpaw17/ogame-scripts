// ==UserScript==
// @name         Ogame AI
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  try to take over the world!
// @author       You
// @match        https://s160-en.ogame.gameforge.com/game/index.php*
// @grant        none
// ==/UserScript==

;(function() {
  const probesToUse = 8
  const ships = {
    SMALL_CARGO: 202,
    LARGE_CARGO: 203,
    CRUISER: 206,
    BATTLESHIP: 207,
    BATTLECRUISER: 215
  }

  const params = location.search
    .split("?")[1]
    .split("&")
    .reduce((a, c) => {
      const [key, value] = c.split("=")
      a[key] = value
      return a
    }, {})

  const apiUrl = path => `${location.origin}/api/${path}`
  const fetchAndParse = uri =>
    fetch(apiUrl(uri))
      .then(res => res.text())
      .then(text => $($.parseXML(text)))

  const goToUrl = page => (location.href = `/game/index.php?page=${page}`)
  const toInt = x => parseInt(x)
  const log = (msg, ...args) => console.log(`[${params.page}]: ${msg}`, ...args)
  const lStorage = JSON.parse(localStorage.getItem("completeJS")) || {}
  const fleetInfo = JSON.parse(
    localStorage.getItem("AGO_EN_UNI160_104889_Fleet_Current")
  )

  window.addEventListener("unload", () => {
    localStorage.setItem("completeJS", JSON.stringify(lStorage))
  })

  const pages = {
    overview,
    fleet1,
    fleet2,
    fleet3,
    messages,
    galaxy
  }

  log(`Available Params:`, params)
  log("Local Storage Contents:", lStorage)

  setTimeout(() => pages[params.page](lStorage, params), 1000)

  function overview(ls, params) {}

  function fleet1(ls, params) {
    const getShipAvailability = type =>
      parseInt($(`#button${type} .level`)[0].innerHTML.split("</span>")[1])

    const setShipsToSend = (type, quantity) =>
      ($(`#ship_${type}`)[0].value = quantity)
    const targetIndex = ls.messages.findIndex(msg => msg.attacking === 0)
    const target = ls.messages[targetIndex]

    if (fleetInfo.fleets < fleetInfo.fleetsSlots) {
      const availableSmallCargo = getShipAvailability(ships.SMALL_CARGO)
      target.ships.am202 <= availableSmallCargo
        ? setShipsToSend(ships.SMALL_CARGO, target.ships.am202)
        : setShipsToSend(ships.LARGE_CARGO, target.ships.am203)

        setShipsToSend(ships.CRUISER, 5)
        setShipsToSend(ships.BATTLESHIP, 5)

      checkShips("shipsChosen")
      $("#continue").click()
    } else {
      ls.fleetStatus = "attacking"
      return goToUrl("galaxy")
    }
  }

  function fleet2(ls, params) {
    const targetIndex = ls.messages.findIndex(msg => msg.attacking === 0)
    const target = ls.messages[targetIndex]
    const setCoord = type => ($(`#${type}`)[0].value = target.coords[type])

    setCoord("galaxy")
    setCoord("system")
    setCoord("position")

    // Make sure Target is set to Planet incase we are attacking from moon
    setTType(1)
    return $("#continue").click()
  }

  function fleet3(ls, params) {
    const targetIndex = ls.messages.findIndex(msg => msg.attacking === 0)
    ls.messages[targetIndex].attacking = 1
    $("#missionButton1").click()
    return $("#start").click()
  }

  function messages(ls, params) {
    const observer = new MutationObserver(() => {
      const [, prev, next, last] = $(".pagination .paginator")

      const currentPage = toInt(prev.dataset.page) + 1
      const totalPages = toInt(last.dataset.page)

      checkMessages()
      log(`Currently on Page ${currentPage} of ${totalPages}`)
      if (currentPage < totalPages) {
        next.click()
      } else {
        log(`Job's Done!`)
        sortMessages()
        observer.disconnect()
      }
    })

    observer.observe(document.getElementById("fleetsTab"), {
      attirbutes: true,
      subtree: true,
      characterData: true,
      childList: true
    })

    checkMessages()
    $(".pagination .paginator")[2].click()

    function sortMessages() {
      const lootPerDist = msg =>
        msg.resources.total / calcTravelTime(msg.coords)

      ls.messages.sort((a, b) => (lootPerDist(b) > lootPerDist(a) ? 1 : -1))

      $('.trash_action').click()
      goToUrl("fleet1")
    }

    function updateLocalStorage(arr) {
      ls.messages = ls.messages || []

      // Passing it this way ensures entries are unique
      const concatenated = [...ls.messages, ...arr].map(JSON.stringify)
      const set = new Set(concatenated)
      const updated = [...set].map(JSON.parse)

      ls.messages = updated
    }

    function checkMessages() {
      const messages = [
        ...$("[data-msg-id]").map((a, { dataset }) => ({
          attacking: toInt(dataset.attacking),
          msgId: toInt(dataset.msgId),
          distance: calcDistance(dataset),
          coords: {
            galaxy: toInt(dataset.galaxy),
            system: toInt(dataset.system),
            position: toInt(dataset.position)
          },
          defense: toInt(dataset.defense),
          fleet: toInt(dataset.fleet),
          resources: {
            total: toInt(dataset.loot),
            metal: toInt(dataset.metal),
            crystal: toInt(dataset.crystal),
            deut: toInt(dataset.deut)
          },
          ships: {
            am202: toInt(dataset.sc),
            am203: toInt(dataset.lc)
          }
        }))
      ]
        .filter(msg => msg.defense >= 0 && msg.defense <= 50000)
        .filter(msg => msg.fleet === 0)
        .filter(msg => msg.resources.total >= 100000)

      updateLocalStorage(messages)
    }
  }

  function galaxy(ls, params) {
    Promise.all([fetchUniverse(), fetchHighcores(), fetchPlayers()]).then(
      ([planets, highscores, players]) => {
        const playersToScout = players
          .filter(player => player.status === "i")
          .filter(player => highscores[player.id] <= 750)
          .map(player => player.id)

        const planetsToScout = planets
          .filter(planet => playersToScout.indexOf(planet.id) !== -1)
          .filter(planet => parseInt(planet.coords.split(":")[0]) <= 3)
          .map(planet => planet.coords)
          .sort((a, b) => {
            const [aG, aS, aP] = a.split(":").map(x => parseInt(x))
            const [bG, bS, bP] = b.split(":").map(x => parseInt(x))

            if (aG > bG) return 1
            if (aG < bG) return -1
            if (aG === bG) {
              if (aS > bS) return 1
              if (aS < bS) return -1
              if (aS === bS) {
                if (aP > bP) return 1
                if (aP < bP) return -1
                if (aP === bP) {
                  return 0
                }
              }
            }
          })

        let index = 0

        const intervalId = setInterval(() => {
          const probeCount = parseInt($("#probeValue").text())
          const [used, total] = $("#slotValue")
            .text()
            .split("/")
            .map(t => parseInt(t))

          if (ls.fleetStatus === "attacking") {
            if (used <= 2) ls.fleetStatus = undefined
            $(".btn_blue")[0].click()
            return log("Fleet is currently attacking, doing nothing for now")
          }

          if (used < total && probeCount >= probesToUse) {
            const [galaxy, sector, planet] = planetsToScout[index].split(":")
            log(
              `[${index}/${planetsToScout.length}]: Sending Probes to ${planetsToScout[index]}`
            )
            window.sendShips(6, galaxy, sector, planet, 1, probesToUse)
            index++
          } else {
            $(".btn_blue")[0].click()
          }

          if (index === planetsToScout.length) {
            clearInterval(intervalId)
            log("Work Complete!")
            setTimeout(() => goToUrl("messages"), 60000)
          }
        }, 1000)
      }
    )
  }

  function fetchHighcores() {
    return fetchAndParse("highscore.xml?category=1&type=0").then(scores => {
      const arr = {}

      scores
        .find("player")
        .each(
          (_, player) =>
            (arr[player.getAttribute("id")] = player.getAttribute("position"))
        )

      return arr
    })
  }

  function fetchPlayers() {
    return fetchAndParse("players.xml").then(players => {
      const arr = []

      players.find("player").each((_, player) =>
        arr.push({
          id: player.getAttribute("id"),
          name: player.getAttribute("name"),
          status: player.getAttribute("status")
        })
      )

      return arr
    })
  }

  function fetchUniverse() {
    return fetchAndParse("universe.xml").then(universe => {
      const arr = []

      universe.find("planet").each((_, planet) =>
        arr.push({
          id: planet.getAttribute("player"),
          coords: planet.getAttribute("coords")
        })
      )

      return arr
    })
  }

  function calcDistance(coords) {
    const coordsString = $(".ago_highlight .planet-koords")[0].innerText
    const [g, s, p] = coordsString
      .slice(1, coordsString.length - 1)
      .split(":")
      .map(toInt)

    const base = {
      galaxy: g,
      system: s,
      position: p
    }

    const galaxy = toInt(coords.galaxy)
    const system = toInt(coords.system)
    const position = toInt(coords.position)

    const calcDist = (distFactor, flatDistance = 0) => (p1, p2) =>
      distFactor * Math.abs(p2 - p1) + flatDistance
    const calcGalaxy = calcDist(20000)
    const calcSystem = calcDist(95, 2700)
    const calcPosition = calcDist(5, 1000)

    if (galaxy !== base.galaxy) return calcGalaxy(galaxy, base.galaxy)
    if (system !== base.system) return calcSystem(system, base.system)
    if (position !== base.position) return calcPosition(position, base.position)
    return 5
  }

  function calcTravelTime(coords, velocity = 28000) {
    const speed = 3500
    const distance = calcDistance(coords)
    const value = Math.sqrt((10 * distance) / velocity)
    const accelerationFactor = 6

    return (10 + speed * value) / accelerationFactor
  }
})()
