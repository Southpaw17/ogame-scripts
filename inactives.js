// ==UserScript==
// @name         Galaxy - Inactive Search
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://s160-en.ogame.gameforge.com/game/index.php?page=galaxy
// @grant        none
// ==/UserScript==

;(function() {
  const pipe = (...args) => a => args.reduce((y, f) => f(y), a)
  const url = path => `https://s160-en.ogame.gameforge.com/api/${path}`
  const fetchAndParse = uri =>
    fetch(url(uri))
      .then(res => res.text())
      .then(text => $($.parseXML(text)))

  Promise.all([fetchHighcores(), fetchPlayers()]).then(
    ([highscores, players]) => {
      const idToKey = (acc, curr) => {
        acc[curr.id] = { ...curr, ...acc[curr.id] }
        return acc
      }

      const thing = highscores.reduce(idToKey, {})
      const output = Object.values(players.reduce(idToKey, thing))
        .filter(player => player.status === "i")
        .filter(player => player.position <= 1000)

      Promise.all(
        output.map(player => fetchAndParse(`playerData.xml?id=${player.id}`))
      )
        .then(players => {
          const t = []
          players.map(element =>
            element
              .find("planet")
              .each((_, ele) => t.push(ele.getAttribute("coords")))
          )

          t.sort((a, b) => {
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

          return t
        })
        .then(coords => {
          let index = 0

          const intervalId = setInterval(() => {
            const probeCount = parseInt($("#probeValue").text())
            const [used, total] = $("#slotValue")
              .text()
              .split("/")
              .map(t => parseInt(t))

            if (used < total && probeCount >= 8) {
              const [galaxy, sector, planet] = coords[index].split(":")
              console.log(
                `[${index}/${coords.length}]: Sending Probes to ${
                  coords[index]
                }`
              )
              window.sendShips(6, galaxy, sector, planet, 1, 8)
              index++
            } else {
              $(".btn_blue")[0].click()
            }

            if (index === coords.length) {
              clearInterval(intervalId)
              console.log("Work Complete!")
            }
          }, 1000)
        })
    }
  )

  function fetchHighcores() {
    return fetchAndParse("highscore.xml?category=1&type=0").then(scores => {
      const arr = []

      scores.find("player").each((_, element) =>
        arr.push({
          id: element.getAttribute("id"),
          position: element.getAttribute("position")
        })
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
})()
