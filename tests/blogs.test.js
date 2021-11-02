const Page = require('./ehlpers/page');

let page;

beforeEach(async () => {
    page = await Page.build();
    await page.goto('http://localhost:3000');

    // describe statements to group together common conditions (i.e. When Logged In)
})

afterEach(async () => {
    await page.close();
})

test('when logged in, can see blog create form', async () => {
    await Page.login();
    // click on blog creation button
    await page.click('a.btn-floating');
    const label = await page.getContentsOf('form label');
    // whenever jest runs there is 5000 ms timeout rule
    expect(label).toEqual('Blog Title');
})

describe('When Logged In', async () => {
    beforeEach(async () => {
        await page.login()
        // click on blog creation button
        await page.click('a.btn-floating');
    })
    test('we can see blog create form', async () => {
        const label = await page.getContentsOf('form label');
        // whenever jest runs there is 5000 ms timeout rule
        expect(label).toEqual('Blog Title');
    })

    describe('and using valid inputs', async () => {
        beforeEach(async () => {
            await page.type('.title input', 'My Title');
            await page.type('.content input', 'My Content');
            await page.click('form button');
        });
        test('Submitting takes user to review screen', async () => {
            const text = await page.getContentsOf('h5');
            expect(text).toEqual('Please confirm your entry');
        });
        test('submitting then saving adds blog to index page', async () => {
            await page.click('button.green');
            await page.waitFor('.card');
            const title = await page.getContentsOf('.card-title');
            const content = await page.getContentsOf('p');
            expect(title).toEqual('My Title');
            expect(content).toEqual('My Content');
        });
    })

    describe('and using invalid inputs', async () => {
        beforeEach(async() => {
            await page.click('form button');
        })
        test('test form shows an error message', async () => {
            const titleError = await page.getContentsOf('.title .red-text');
            const contentError = await page.getContentsOf('.content .red-text');
            expect(titleError).toEqual('You must provide a value');
            expect(contentError).toEqual('You must provide a value');
        })
    })
})

// we use fetch because no guarantee axios is available in chromium
describe('User is not logged in', async () => {
    const actions = [
        {
            method: 'get',
            path: 'api/blogs'
        },
        {
            method: 'post',
            path: '/api/blogs',
            data: {
                title: 'TEST',
                content: 'TEST'
            }
        }
    ]

    test('Blog related actions are prohibited', async () => {
        const results = await page.execRequests(actions);
        for(let result of results) {
            expect(result).toEqual({error: 'You must login!'})
        }
    })

    // // execute arbitrary JS in chromium browser
    // // page.evalulate takes function, args
    // test('User cannot get blog posts', async () => {
    //     const result = await page.get('/api/blogs');
    //     expect(result).toEqual({error: 'You must log in!'})
    // });
    // test('User cannot create blog posts', async () => {
    //     const result = await page.post('/api/blogs', { title: 'Test', content: 'Test'});
    //     expect(result).toEqual({error: 'You must log in!'})
    // });
});