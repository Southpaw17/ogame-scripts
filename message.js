// ==UserScript==
// @name         Sort and Filter Messages
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://s160-en.ogame.gameforge.com/game/index.php?page=messages
// @grant        none
// ==/UserScript==

;(function() {
  setTimeout(() => {
    const localStorageKey = "msgInfo"
    const url = () => `/game/index.php?page=fleet1&type=1&routune=3`

    const observer = new MutationObserver(() => {
      const [, prev, next, last] = $(".pagination .paginator")

      const currentPage = parseInt(prev.dataset.page) + 1
      const totalPages = parseInt(last.dataset.page)

      checkMessages()
      console.log(`Currently on Page ${currentPage} of ${totalPages}`)
      if (currentPage < totalPages) {
        next.click()
      } else {
        $("[name=delEspLoot]")[0].click()
        $("[name=delEspDef]")[0].click()
        console.log(`Job's Done!`)
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
    localStorage.removeItem(localStorageKey)
    checkMessages()
    $(".pagination .paginator")[2].click()

    function sortMessages() {
      const ls = updateLocalStorage([])
      const lootPerDist = msg =>
        msg.resources.total / calcTravelTime(msg.coords)

      ls.sort((a, b) => (lootPerDist(b) > lootPerDist(a) ? 1 : -1))

      localStorage.removeItem(localStorageKey)
      localStorage.setItem(localStorageKey, JSON.stringify(ls))
      location.href = url()
    }

    function updateLocalStorage(arr) {
      const ls = JSON.parse(localStorage.getItem(localStorageKey)) || []

      const concatenated = [...ls, ...arr].map(JSON.stringify)
      const set = new Set(concatenated)
      const updated = [...set].map(JSON.parse)
      localStorage.setItem(localStorageKey, JSON.stringify(updated))
      return updated
    }

    function checkMessages() {
      const messages = [
        ...$("[data-msg-id]").map((a, { dataset }) => ({
          attacking: parseInt(dataset.attacking),
          msgId: parseInt(dataset.msgId),
          distance: calcDistance(dataset),
          coords: {
            galaxy: parseInt(dataset.galaxy),
            system: parseInt(dataset.system),
            position: parseInt(dataset.position)
          },
          defense: parseInt(dataset.defense) + parseInt(dataset.fleet),
          resources: {
            total: parseInt(dataset.loot),
            metal: parseInt(dataset.metal),
            crystal: parseInt(dataset.crystal),
            deut: parseInt(dataset.deut)
          },
          ships: {
            am202: parseInt(dataset.sc),
            am203: parseInt(dataset.lc)
          }
        }))
      ]
        .filter(msg => msg.defense === 0)
        .filter(msg => msg.resources.total >= 100000)

      updateLocalStorage(messages)
    }

    function calcDistance(coords) {
      const coordsString = $(".ago_highlight .planet-koords")[0].innerText
      const [g, s, p] = coordsString
        .slice(1, coordsString.length - 1)
        .split(":")
        .map(x => parseInt(x))

      const base = {
        galaxy: g,
        system: s,
        position: p
      }

      const galaxy = parseInt(coords.galaxy)
      const system = parseInt(coords.system)
      const position = parseInt(coords.position)

      const calcDist = (distFactor, flatDistance = 0) => (p1, p2) =>
        distFactor * Math.abs(p2 - p1) + flatDistance
      const calcGalaxy = calcDist(20000)
      const calcSystem = calcDist(95, 2700)
      const calcPosition = calcDist(5, 1000)

      if (galaxy !== base.galaxy) return calcGalaxy(galaxy, base.galaxy)
      if (system !== base.system) return calcSystem(system, base.system)
      if (position !== base.position)
        return calcPosition(position, base.position)
      return 5
    }

    function calcTravelTime(coords, velocity = 28000) {
      const speed = 3500
      const distance = calcDistance(coords)
      const value = Math.sqrt((10 * distance) / velocity)
      const accelerationFactor = 6

      return (10 + speed * value) / accelerationFactor
    }
  }, 1000)
})()
