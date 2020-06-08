// const assert = require("assert");
const mongoose = require("mongoose");

require("dotenv").config({ path: "variables.env" });
const User = require("../models/User");
const Stores = require("../models/Store");
const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../start");
let should = chai.should();

chai.use(chaiHttp);

// Connect to our Database and handle any bad connections

// describe("Checking DB connection", () => {
//   before("should connect to db", (done) => {
//     mongoose.connect(process.env.DATABASE, done);
//   });

//   it("It should connect", (done) => {
//     done();
//   });
// });

describe("Store", () => {
  beforeEach((done) => {
    mongoose.connect(process.env.DATABASE, done);
  });

  describe("/GET Store", () => {
    it("Should get all Stores fron DB", (done) => {
      chai
        .request(server)
        .get("/")
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
