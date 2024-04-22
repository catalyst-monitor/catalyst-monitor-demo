import { Browser, Builder, By, WebDriver } from 'selenium-webdriver'
import { exec } from 'node:child_process'
import util from 'node:util'
import Firefox from 'selenium-webdriver/firefox'
import process from 'node:process'

const execPromise = util.promisify(exec)

const baseUrl = process.env.CATALYST_SVELTEKIT_DEMO_BASE_URL

main()

async function main() {
  if (baseUrl == null) {
    console.log(
      'Please set CATALYST_SVELTEKIT_DEMO_BASE_URL environment variable'
    )
    process.exit(1)
  }

  console.log('Starting the demo bot.')

  process.on('SIGINT', () => {
    console.log('SIGINT received...')
    process.exit()
  })
  process.on('SIGTERM', () => {
    console.log('SIGTERM received...')
    process.exit()
  })

  console.log('Running...')
  let runCount = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const start = new Date()
    const driver = await new Builder()
      .forBrowser(Browser.FIREFOX)
      .setFirefoxOptions(
        new Firefox.Options()
          .setPreference(
            'general.useragent.override',
            'Catalyst-Sveltekit-Demo-Bot'
          )
          .setPreference('app.update.auto', false)
          .setPreference('app.update.enabled', false)
          .addArguments('--headless')
      )
      .build()
    await driver.manage().setTimeouts({ implicit: 2000 })

    try {
      await driver.manage().deleteAllCookies()
      await handleShortLink(baseUrl, driver)
      await handleTodo(baseUrl, driver)
      await driver.quit()
    } catch (e) {
      console.error('ERROR: ', e)
    }
    if (runCount > 100) {
      console.log('100 runs.')
      runCount = 0
    }
    runCount++

    // Manually kill all Firefox processes, as they can stay alive and cause memory leaks.
    try {
      await execPromise('pkill firefox')
    } catch (e) {
      if (
        e != null &&
        typeof e == 'object' &&
        'code' in e &&
        typeof e.code == 'number' &&
        e.code > 1
      ) {
        console.log('Could not kill firefox', e)
        throw e
      }
    }

    const timeToWait = 15000 - (new Date().getTime() - start.getTime())
    if (timeToWait > 0) {
      await new Promise((r) => setTimeout(r, timeToWait))
    }
  }
}

async function handleShortLink(url: string, driver: WebDriver) {
  await driver.get(url)
  await driver.findElement(By.linkText('Link shortener')).click()

  // Create a short link.
  const demoShortLinkName = `${Math.round(Math.random() * 100)}`
  await driver
    .findElement(By.className('fullUrlInput'))
    .sendKeys('https://www.catalystmonitor.com')
  await driver
    .findElement(By.name('shortLink'))
    .sendKeys(`demo-${demoShortLinkName}`)
  await driver
    .findElement(By.name('password'))
    .sendKeys(`pass-${demoShortLinkName}`)
  await driver.findElement(By.css('.buttonRow button')).click()

  // Test the link
  await driver
    .findElement(By.linkText(`/shortener/demo-${demoShortLinkName}`))
    .click()

  // Test changing, bad password
  await driver.get(`${url}/shortener`)
  await driver
    .findElement(By.className('fullUrlInput'))
    .sendKeys('https://www.catalystmonitor.com')
  await driver
    .findElement(By.name('shortLink'))
    .sendKeys(`demo-${demoShortLinkName}`)
  await driver.findElement(By.name('password')).sendKeys('badpass')
  await driver.findElement(By.css('.buttonRow button')).click()
}

async function handleTodo(url: string, driver: WebDriver) {
  await driver.get(url)
  await driver.findElement(By.linkText('To do list')).click()

  await driver.findElement(By.css('.createRow button')).click()

  // const password = await driver
  //   .findElement(By.className('passwordInput'))
  //  .getText()

  const todoInputEl = await driver
    .findElement(By.className('todoInputRow'))
    .findElement(By.css('input'))
  const createBtn = await driver.findElement(By.css('.todoInputRow button'))

  await todoInputEl.sendKeys('Do this.')
  await createBtn.click()

  await driver.findElement(By.css('.todo input[type="checkbox"]')).click()

  await driver.findElement(By.css('.todo button')).click()

  await driver.get(`${url}/todo`)

  await driver.findElement(By.css('.restoreRow input')).sendKeys('badPass')

  await driver.findElement(By.css('.restoreRow button')).click()
}
