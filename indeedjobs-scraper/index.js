const puppeteer = require("puppeteer");
var moment = require('moment');
var csvWriter = require("./csvWriterJobs");
const pageLimit = 5; // Maximum number of pages to be scanned
let jobs = [];


module.exports.run = async (jobTitle, city, province) => {
  jobs = [];
  csvWriter.createFile(jobTitle, city);
  let pageCounter = 0;
  if (jobTitle) {
    jobTitle = jobTitle.trim().split(' ').join('+');
    const webAddress = "https://ca.indeed.com/jobs?q=" + jobTitle + "&l=" + city + "%2C+" + province + "&sort=date";
    // console.log("web address: " + webAddress);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(webAddress);
    await loadLatestJobs(page);
    await browser.close();
    console.log("Process completed");
  };

  module.exports.getJobs = () => jobs;

  function addJob(title, company, location, link, postDate, ...summary) {
    if (jobs) {
      const job = { title, company, location, link, postDate, summary };
      jobs.push(job);
      csvWriter.addNewJob(job);
      // console.log(job);
    }
  }

  async function getPropertyValue(element, propertyName) {
    const property = await element.getProperty(propertyName);
    return await property.jsonValue();
  }

  async function loadLatestJobs(page) {
    pageCounter++;
    const todaysJobsBody = await page.$("#resultsCol");
    const bodyRows = await todaysJobsBody.$$("div");

    const rowsMapping = bodyRows.map(async row => {
      const jobTitleElement = await row.$(".title");
      if (jobTitleElement) {
        const titleValue = await getPropertyValue(jobTitleElement, "innerText");
        const link = await getPropertyValue((await jobTitleElement.$("a")), "href");
        let company = "";
        let location = "";
        let summary = [];
        let postDate = null;
        const companyDiv = await row.$(".sjcl");
        if (companyDiv) {
          const companyEl = await companyDiv.$(".company");
          if (companyEl) {
            company = await getPropertyValue(companyEl, "innerText");
          }
        }
        const locationDiv = await row.$(".location");
        if (locationDiv) {
          location = await getPropertyValue(locationDiv, "innerText");
        }
        const dateDiv = await row.$(".date");
        if(dateDiv){
          let date = await getPropertyValue(dateDiv, "innerText");
          const days = parseInt(date);
          if(days){
             postDate = moment() - days*86400000;
          }else{
            if(date.toLowerCase() == "today" || date.toLowerCase() == "just posted"){
               postDate = moment();
            }else{
              console.log("Date found is not predicted yet. Talk to Silvia.");
            }
          }
        }
        const summaryDiv = await row.$(".summary");
        if (summaryDiv) {
          const summaryItems = await row.$$("li");
          summary = await Promise.all(
            summaryItems.map(async item => {
              return (
                await getPropertyValue(item, "innerText")
              );
            })
          );
        }
        // Add new Job
        addJob(titleValue, company, location, link, moment(postDate).format("DD MMM YYYY"), ...summary);
      }
    });
    await Promise.all(rowsMapping);

    if (pageCounter <= pageLimit) {
      //Check if there is a next page. 
      const pagination = await page.$(".pagination");
      if (pagination) {
        const pagLinks = await pagination.$$("a");
        if (pagLinks) {
          const nextPageDiv = pagLinks[pagLinks.length - 1];
          const hasNextPage = await nextPageDiv.$(".np");
          if (hasNextPage) {
            const nextPageLink = await getPropertyValue(nextPageDiv, "href");
            // console.log("next page link: " + nextPageLink);
            if (nextPageLink) {
              await page.goto(nextPageLink);
              await loadLatestJobs(page);
            }
          }
        }
      }
    }
  }
}

module.exports.run("lawyer assistant", "vancouver", "bc");
