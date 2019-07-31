// ==UserScript==
// @name         Galaxy - Inactive Search
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://s160-en.ogame.gameforge.com/game/index.php?page=galaxy
// @grant        none
// ==/UserScript==

;(function() {
  const url = path => `https://s160-en.ogame.gameforge.com/api/${path}`
  const fetchAndParse = uri =>
    fetch(url(uri))
      .then(res => res.text())
      .then(text => $($.parseXML(text)))

  Promise.all([fetchUniverse(), fetchHighcores(), fetchPlayers()]).then(
    ([planets, highscores, players]) => {
      const playersToScout = players
        .filter(player => player.status === "i")
        .filter(player => highscores[player.id] <= 500)
        .map(player => player.id)

      const planetsToScout = planets
        .filter(planet => playersToScout.indexOf(planet.id) !== -1)
        .filter(planet => parseInt(planet.coords.split(':')[0]) <= 3)
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

        if (localStorage.getItem("fleetStatus") === "attacking") {
          if (used === 0) localStorage.removeItem("fleetStatus")
          $(".btn_blue")[0].click()
          return console.log(
            "Fleet is currently attacking, doing nothing for now"
          )
        }

        if (used < total && probeCount >= 8) {
          const [galaxy, sector, planet] = planetsToScout[index].split(":")
          console.log(
            `[${index}/${planetsToScout.length}]: Sending Probes to ${planetsToScout[index]}`
          )
          window.sendShips(6, galaxy, sector, planet, 1, 8)
          index++
        } else {
          $(".btn_blue")[0].click()
        }

        if (index === planetsToScout.length) {
          clearInterval(intervalId)
          console.log("Work Complete!")
          setTimeout(
            () => (location.href = "/game/index.php?page=messages"),
            60000
          )
        }
      }, 1000)
    }
  )

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
})()
