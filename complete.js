// ==UserScript==
// @name         Ogame AI
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  try to take over the world!
// @author       You
// @match        https://s160-en.ogame.gameforge.com/game/index.php*
// @grant        none
// ==/UserScript==

;(function() {
  const goToUrl = page => {
    location.href = `/game/index.php?page=${page}`
  }

  const params = location.search
    .split("?")[1]
    .split("&")
    .reduce((a, c) => {
      const [key, value] = c.split("=")
      a[key] = value
      return a
    }, {})

  console.log(`You are on page ${params.page}`, params)

  const pages = {
    overview,
    fleet1,
    fleet2,
    fleet3,
    messages,
    galaxy
  }

  pages[params.page](params)

  function overview(params, localStorage) {
    console.log("We made it boys")
  }

  function fleet1(params, localStorage) {}

  function fleet2(params, localStorage) {}

  function fleet3(params, localStorage) {}

  function messages(params, localStorage) {}

  function galaxy(params, localStorage) {}
})()
