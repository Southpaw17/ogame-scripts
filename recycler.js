;(() => {
  let timeoutId = 0
  const logger = coords => msg => console.info(`${coords} - ${msg}`)
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

  const galaxyInput = $("#galaxy_input")[0]
  const systemInput = $("#system_input")[0]
  const goButton = $(".btn_blue")[0]

  const noSlots = () => {
    const fraction = $("#slots")[0]
      .innerText.split(" ")
      .pop()
    const [used, available] = fraction.split("/").map(x => parseInt(x))

    // Leave 2 fleet slots open at all times
    return used >= available - 2
  }

  const noRecyclers = () => parseInt($("#recyclerValue")[0].innerText) === 0

  const goToNextGalaxyOrSystem = () => {
    const currGalaxy = parseInt(galaxyInput.value)
    const currSystem = parseInt(systemInput.value)

    galaxyInput.value = Math.max(currGalaxy + Math.floor(currSystem / 499), 1)
    systemInput.value = Math.max((currSystem + 1) % 500, 1)

    goButton.click()
  }

  const eventHandler = () => {
    clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      if (noRecyclers() || noSlots()) {
        console.log(
          "No Recyclers Available or Not enough Fleet Slots. Standing By..."
        )
        sleep(60000).then(() => goButton.click())
        return
      }

      $(".ListLinks")
        .filter((idx, ele) => $(ele).find(".debris-recyclers").length)
        .each((idx, element) => {
          const [recyclersNeeded] = $(element)
            .find(".debris-recyclers")
            .map((idx, ele) => parseInt(ele.innerText.split(":")[1]))
          const coords = $(element.parentElement).find("#pos-debris")[0]
            .innerText
          const log = logger(coords)

          if (recyclersNeeded > 1) {
            log(`Recyclers Needed: ${recyclersNeeded}`)

            // Clicking the link will re-trigger the event handler, which will
            // cause us to send multiple fleeds to the same debris field
            $("body").off()
            $(element)
              .find("a")
              .click()

            sleep(1000).then(() => {
              registerEvent()
              goToNextGalaxyOrSystem()
            })
          }
        })

      goToNextGalaxyOrSystem()
    }, 10)
  }

  const registerEvent = () => {
    $("body").off()
    $("body").on("DOMSubtreeModified", "#galaxyContent", eventHandler)
  }

  registerEvent()
  $(".btn_blue")[0].click()
})()
