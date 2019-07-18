;(function() {
  const url = (path) => `https://s160-en.ogame.gameforge.com/api/${path}`
  const fetchAndParse = (uri) =>
    fetch(uri)
      .then((res) => res.text())
      .then((text) => $($.parseXML(text)))
  Promise.all([fetchHighcores(), fetchPlayers()]).then(
    ([highscores, players]) => {
      const idToKey = (acc, curr) => {
        acc[curr.id] = { ...curr, ...acc[curr.id] }
        return acc
      }

      const thing = highscores.reduce(idToKey, {})
      const output = Object.values(players.reduce(idToKey, thing))
        .filter((player) => player.status === 'i')
        .filter((player) => player.position <= 500)

      Promise.all(
        output.map((player) =>
          fetchAndParse(url(`playerData.xml?id=${player.id}`))
        )
      )
        .then((arr) => {
          const t = []
          arr.map((element) =>
            element
              .find('planet')
              .each((_, ele) => t.push(ele.getAttribute('coords')))
          )

          return t
        })
        .then((coords) => {
          let index = 0

          const intervalId = setInterval(() => {
            const probeCount = parseInt($('#probeValue').text())
            const [used, total] = $('#slotValue')
              .text()
              .split('/')
              .map((t) => parseInt(t))

            if (used < total && probeCount >= 8) {
              const [galaxy, sector, planet] = coords[index].split(':')
              console.log(
                `[${index}/${coords.length}]: Sending Probes to ${coords[index]}`
              )
              window.sendShips(6, galaxy, sector, planet, 1, 8)
              index++
            } else {
              $('.btn_blue')[0].click()
            }

            if (index === coords.length) {
              clearInterval(intervalId)
              console.log('Work Complete!')
            }
          }, 1000)
        })
    }
  )

  function fetchHighcores() {
    return fetchAndParse(url('highscore.xml?category=1&type=0')).then(
      (scores) => {
        const arr = []

        scores.find('player').each((_, element) =>
          arr.push({
            id: element.getAttribute('id'),
            position: element.getAttribute('position')
          })
        )

        return arr
      }
    )
  }

  function fetchPlayers() {
    return fetchAndParse(url('players.xml')).then((players) => {
      const arr = []

      players.find('player').each((_, player) =>
        arr.push({
          id: player.getAttribute('id'),
          name: player.getAttribute('name'),
          status: player.getAttribute('status')
        })
      )

      return arr
    })
  }
})()
