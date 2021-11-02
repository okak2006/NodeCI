const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
    static async build () {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });

        const page = await browser.newPage();
        // create instance of Custom Page
        const customPage = new CustomPage(page);

        return new Proxy(customPage, {
            get: function (target, property) {
                return customPage[property] || browser[property] || page[property];
            }
        })
    }
    // maek reference to this.page once CustomPage is instantiated
    constructor(page) {
        this.page = page;
    }

    async login() {
        // factory to make new user
        const user = await UserFactory();
        const {session, sig} = sessionFactory(user);

        //add cookie to puppeteer browser. First we need to navigate to our app which we did in the beforeEach hook
        await this.page.setCookie({ name: 'session', value: session });
        await this.page.setCookie({ name: 'session.sig', value: sig});
        await this.page.goto('http://localhost:3000/blogs');
        // waitfor to make sure not only we visited page but all element is loaded
        await page.waitFor('a[href="/auth/logout');
    }

    async getContentsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }

    get(path) {
        // Warning: evaluate turns the callback into a string, so just referencing path like we normally would does not work (path wouldn't be defined)
        // puppeteer.evaluate takes ...args for this purpose
        return this.page.evaluate(
            (_path) => {
                return fetch(_path, {
                    method: GET,
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }).then(res => res.json());
            }, path
        );
    }

    post(path, data) {
        return this.page.evaluate(
            (_path, _data) => {
                return fetch(_path, {
                    method: POST,
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(_data)
                }).then(res => res.json());
            }, path, data
        );
    }

    // takes arr of actions and execute tests
    execRequests(actions) {
        Promise.all(
            actions.map(({ method, path, data }) => {
                // this will still work with get because in that case data = undefined and doesn't get used
                return this[method](path, data);
            })
        )
    }
}

module.exports = customPage;