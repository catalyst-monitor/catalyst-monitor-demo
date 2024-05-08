import { Browser, Builder, By, WebDriver } from 'selenium-webdriver'
import Firefox from 'selenium-webdriver/firefox'
import process from 'node:process'

const baseUrl = process.env.CATALYST_SVELTEKIT_DEMO_BASE_URL

main()

const creds = [
  { userName: 'rowan@work.com', password: 'pass1' },
  { userName: 'casey@work.com', password: 'pass1' },
  { userName: 'ali@work.com', password: 'pass1' },
  { userName: 'parker@work.com', password: 'pass1' },
]

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

    await driver.manage().setTimeouts({ implicit: 5000 })

    try {
      await driver.manage().deleteAllCookies()
      await login(baseUrl, driver, creds[runCount % creds.length])
      await handleShortLink(baseUrl, driver)
      await handleTodo(baseUrl, driver, runCount)
    } catch (e) {
      console.error('ERROR: ', e)
    }
    await driver.quit()
    if (runCount > 100) {
      console.log('100 runs.')
      runCount = 0
    }
    runCount++

    const timeToWait = 15000 - (new Date().getTime() - start.getTime())
    if (timeToWait > 0) {
      await new Promise((r) => setTimeout(r, timeToWait))
    }
  }
}

async function login(
  url: string,
  driver: WebDriver,
  creds: { userName: string; password: string }
) {
  await driver.get(url)

  await driver.findElement(By.name('userName')).sendKeys(creds.userName)

  await driver.findElement(By.name('password')).sendKeys(creds.password)

  await driver.findElement(By.className('loginBtn')).click()

  await driver.findElement(By.className('logoutBtn'))
}

async function handleShortLink(url: string, driver: WebDriver) {
  await driver.get(url)
  await driver.findElement(By.className('logoutBtn'))

  await driver.findElement(By.linkText('Link shortener')).click()

  // Create a short link.
  const demoShortLinkName = `${Math.round(Math.random() * 1000000)}`
  await driver
    .findElement(By.className('fullUrlInput'))
    .sendKeys('https://www.catalystmonitor.com')
  await driver
    .findElement(By.name('shortLink'))
    .sendKeys(`demo-${demoShortLinkName}`)
  await driver.findElement(By.css('.buttonRow button')).click()

  // Test the link
  await driver.findElement(By.className('tryLink')).click()
  await driver.sleep(1000)

  // Test changing
  await driver.get(`${url}/shortener`)
  await driver
    .findElement(By.className('fullUrlInput'))
    .sendKeys('https://www.catalystmonitor.com')
  await driver
    .findElement(By.name('shortLink'))
    .sendKeys(`demo-${demoShortLinkName}`)
  await driver.findElement(By.css('.buttonRow button')).click()

  await driver.findElement(By.className('delete')).click()
}

async function handleTodo(url: string, driver: WebDriver, runCount: number) {
  await driver.get(url)
  await driver.findElement(By.className('logoutBtn'))

  await driver.findElement(By.linkText('To do list')).click()

  const todoInputEl = await driver
    .findElement(By.className('todoInputRow'))
    .findElement(By.css('input'))
  const createBtn = await driver.findElement(By.css('.todoInputRow button'))

  await todoInputEl.sendKeys('Do this.')
  await createBtn.click()

  await driver.findElement(By.css('.todo input[type="checkbox"]')).click()

  if (runCount % 5 == 1) {
    await driver.findElement(By.css('.todo button')).click()
  }
}
