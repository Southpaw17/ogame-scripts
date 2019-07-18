(function () {
  const fetchAndParse = (url) => fetch(url).then((res) => res.text()).then((text) => $($.parseXML(text)))
  Promise.all([
    fetchAndParse('https://s160-en.ogame.gameforge.com/api/highscore.xml?category=1&type=0'),
    fetchAndParse('https://s160-en.ogame.gameforge.com/api/players.xml')
  ]).then(([highscores, players]) => {
    const hsObj = []
    const playerObj = []

    highscores.find('player')
      .map(
        (_, player) => (
          { id: player.getAttribute('id'), position: player.getAttribute('position') }
        ))
      .each((_, element) => hsObj.push(element))

    players.find('player').map((_, player) => ({
      id: player.getAttribute('id'),
      name: player.getAttribute('name'),
      status: player.getAttribute('status')
    })).each((_, element) => playerObj.push(element))

    const idToKey = (acc, curr) => {
      acc[curr.id] = { ...curr, ...acc[curr.id] }
      return acc
    }

    const thing = hsObj.reduce(idToKey, {})
    const output = Object.values(playerObj.reduce(idToKey, thing))
      .filter((player) => player.status === 'i')
      .filter((player) => player.position <= 500)

    Promise.all(
      output.map((player) => fetchAndParse(`https://s160-en.ogame.gameforge.com/api/playerData.xml?id=${player.id}`))
    ).then((arr) => {
      const t = []
      arr.map((element) => element.find('planet').each((_, ele) => t.push({
        name: ele.getAttribute('name'),
        coords: ele.getAttribute('coords')
      })))

      console.log(t)
    })
  })
})()
