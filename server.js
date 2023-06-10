const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const request = require('request');
const cheerio = require('cheerio');
const fetch = (...args) => 
            import('node-fetch').then(({default:fetch}) => fetch(...args))

const CLIENT_ID = "54bef3e167b607bc6edb"
const CLIENT_SECRET = "0d77e174f3a456285de803667cbf9052a997c662"

const GITHUB_ACCESS_TOKEN_URI = "https://github.com/login/oauth/access_token"
const GITHUB_USER_DETAILS_URI = "https://api.github.com/user"
const GITHUB_TRENDING_URI = "https://github.com/trending"
const GITHUB_HOME = "https://github.com"

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/getAccessToken', async (req, res) =>{
    const params = `?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${req.query.code}`;

    await fetch(GITHUB_ACCESS_TOKEN_URI + params, {
        method:'POST',
        headers:{
            "Accept":"application/json"
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        res.json(data)
    }).catch(err => {
        console.log("Something went wrong",err)
    })
})


app.get('/userDetails', async (req, res) => {
    req.get("Authorization")
    await fetch(GITHUB_USER_DETAILS_URI,{
        method:"GET",
        headers:{
            "Authorization":req.get("Authorization")
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        res.json(data)
    }).catch(err => {
        console.log("Something went wrong",err)
    })
})

app.get('/trending',(req,res) => {
    request.get(GITHUB_TRENDING_URI, (error, response, body) => {

        if (!error && response.statusCode == 200) {
    
            // Load HTML string into cheerio
            const $ = cheerio.load(body);
    
            // Below are the CSS selectors to
            // fetch the data required
            let temp = $('.Box-row')
            let repos = $('.h3.lh-condensed a');
            
            let data = [];
            for (let i = 0; i < repos.length; i++) {
                let reponame = $(temp[i])
                    .find('.h3.lh-condensed a')
                    .text().replace(
                    /[\n\r]+|[\s]{2, }/g, ' ').trim();
                
                let organisation = reponame.substring(0,reponame.indexOf('/')).trim()
                let repository = reponame.substring(reponame.indexOf('/')+1, reponame.length).trim()
    
                let repolanguage = $(temp[i])
                    .find(
    '.f6.color-fg-muted.mt-2 span span[itemprop="programmingLanguage"]')
                    .text()
                    .replace(/[\n\r]+|[\s]{2, }/g, ' ').trim();
    
                let repostars = $(temp[i])
                    .find(
    '.f6.color-fg-muted.mt-2 .Link--muted.d-inline-block.mr-3')
                    .text()
                    .replace(/[\n\r]+|[\s]{2, }/g, ' ').trim();
                let stars = repostars.substring(0, repostars.indexOf(' '))
                let forks = repostars.substring(repostars.lastIndexOf(' ')+1, repostars.length)
    
                // Push the fetched data into an object
                data.push({
                    'organisation':organisation,
                    'repository': repository,
                    'language': repolanguage,
                    'stars':Number(stars.replace(',','').trim()),
                    'forks':Number(forks.replace(',','').trim()),
                })
            }
    
            res.json(data)
        }
        else {
            res.json({msg:"Something went wrong"})
        }
    });
    
})


app.get('/:organisation/:repository',async (req, res) => {
    request.get(GITHUB_HOME + '/' + req.params.organisation + '/' + req.params.repository, (error, response, body) => {

        // If the response code is 200 and
        // there is no error
        if (!error && response.statusCode == 200) {
    
            // Load HTML string into cheerio
            const $ = cheerio.load(body);
    
            // Below are the CSS selectors to
            // fetch the data required
            let temp = $('.markdown-body.entry-content.container-lg')
            let fork = $('#fork-button')
            let stars = $('#repo-stars-counter-star').text().trim()
            const forkCount = fork.find('span').text().trim()
            const tagLine = temp.find('blockquote p').text().trim()
            const description = temp.find('p').text().trim()
            res.json({forks:Number(forkCount.replace(',','').trim()),stars:Number(stars.replace(',','').trim()),tagLine,description})
        }
        else {
            res.json({msg:"Something went wrong"})
        }
    });
})

app.listen(4000, () => console.log("Server started on port 4000"))