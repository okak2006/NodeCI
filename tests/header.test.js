const { session } = require('passport');
const Page = require('./helpers/page');
const page;

// execute this generic portion before running each test
beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');
})

afterEach(async () => {
    await page.close();
})

test('We can launch a browser', async () => {
    const text = page.$eval('a.brand-logo', el => el.innerHTML);
    expect(text === 'sometext');
})

test('clicking login starts oath flow', async () => {
    await page.click('.right a');
    const url = await page.url();
    expect(url).toMatch(/accounts\.google\.com/);
})

test('when signed in, shows logout button', async () => {
    await Page.login();
    
    const buttonText = await page.getContentsOf('a.brand-logo');
    expect(buttonText === 'logout');
})