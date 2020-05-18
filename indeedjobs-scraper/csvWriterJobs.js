const fs = require('fs');
let csvWriter = require('csv-write-stream');
let writer = csvWriter({ sendHeaders: false }); //Instantiate var
var moment = require('moment');
let csvFilename = "";

//For later:
// Initially, if file already exists, create another with a different name

function createFile(jobTitle, city) {
  // If CSV file does not exist, create it and add the headers
  const date = moment().format("MMM[_]DD[_]YYYY");
  csvFilename = "./search_results/jobs_" + jobTitle.replace(/ +/g, "_") + "_" + city + "_" + date + ".csv";
  console.log("File name: " + csvFilename);
  if (!fs.existsSync(csvFilename)) {
    writer = csvWriter({ sendHeaders: false });
    writer.pipe(fs.createWriteStream(csvFilename));
    writer.write({
      header1: 'Title',
      header2: 'Date',
      header3: 'Location',
      header4: 'Company',
      header5: 'Summary',
      header6: "Link"
    });
    writer.end();
  } else {
    console.log("A file for this job, city and date already exist. Delete the existent file and run the script again if you want to replace it.");
  }
}


function addNewJob(job) {
  // Append some data to CSV the file    
  writer = csvWriter({ sendHeaders: false });
  writer.pipe(fs.createWriteStream(csvFilename, { flags: 'a' }));
  writer.write({
    header1: job.title,
    header2: job.postDate,
    header3: job.location,
    header4: job.company,
    header5: job.summary,
    header6: job.link
  });
  writer.end();
}



module.exports = {
  createFile,
  addNewJob
}