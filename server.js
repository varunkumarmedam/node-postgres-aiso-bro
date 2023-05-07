require("dotenv").config();

const express = require("express");
const app = express();
var bodyParser = require("body-parser");
var cors = require('cors')

app.use(bodyParser.json());

app.use(cors({
  'allowedHeaders': ['Content-Type'],
  'origin': '*',
  'preflightContinue': true
}));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.USER_OR_DATABASE,
  host: process.env.HOST,
  database: process.env.USER_OR_DATABASE,
  password: process.env.PASSWORD,
  port: process.env.DB_PORT,
});

const slaves_pool = new Pool({
  user: process.env.USER_OR_DATABASE,
  host: process.env.HOST,
  database: process.env.USER_OR_DATABASE,
  password: process.env.PASSWORD,
  port: 5001,
});

app.get("/", (req, res) => {
  res.send("Hello buddy!!");
});

app.get("/users", async (req, res) => {
  try {
    const text = "SELECT * FROM users";

    const data = await slaves_pool.query(text);

    res.status(200).send({ result: data.rows });
  } catch (error) {
    const text = "SELECT * FROM users";

    const data = await pool.query(text);

    res.status(200).send({ result: data.rows });
    //console.log(error);
    //res.status(401).send({ error, message: "something went wrong while retriving users" });
  }
});

app.post("/users", async (req, res) => {
  if (!req.body.name || !req.body.email) {
    res
      .status(401)
      .send({ message: "Please provide name and email of the user" });
    return;
  }

  try {
    const text = "INSERT INTO users(name, email,department,fromdate,todate,status) VALUES($1, $2, $3, $4, $5, $6) RETURNING *";
    const values = [req.body.name, req.body.email, req.body.department, req.body.fromdate, req.body.todate, req.body.status];

    // callback
    pool.query(text, values, async (err, dbRes) => {
      if (err) {
        console.log(err.stack);
        res.status(401).send({ message: "failed to insert a nre user", err });
      } else {
        res
          .status(200)
          .send({ message: "Created user successfully", result: dbRes.rows });
      }
    });
  } catch (error) {
    res.status(401).send({ error, message: "something went wrong" });
  }
});

app.put("/users/:id", async (req, res) => {
  if (!req.params.id) {
    res.status(401).send({ message: "Please provide user id" });
    return;
  }

  if (!req.body.name && !req.body.email) {
    res.status(401).send({ message: "Provide name or email" });
    return;
  }

  try {
    let query = "UPDATE users SET ";
    if (req.body.name) query += `name = '${req.body.name}',`;
    if (req.body.email) query += `email = '${req.body.email}',`;
    if (req.body.department) query += `department = '${req.body.department}',`;
    if (req.body.fromdate) query += `fromdate = '${req.body.fromdate}',`;
    if (req.body.todate) query += `todate = '${req.body.todate}',`;
    if (req.body.status) query += `status = '${req.body.status}' `;
    if(query.slice(-1)==',')
    query = query.slice(0,-1);
    query += `WHERE id = ${req.params.id}`;
    pool.query(query, async (err, dbRes) => {
      if (err) {
        console.log(err.stack);
        res.status(401).send({ message: "failed to update a user", err });
      } else {
        res
          .status(200)
          .send({ message: "Updated user successfully", result: dbRes.rows });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: error, message: "something went wrong" });
  }
});

app.delete("/users/:id", async (req, res) => {
  if (!req.params.id) {
    res.status(401).send({ message: "Please provide user id" });
    return;
  }

  try {
    let query = `DELETE FROM users WHERE id = ${req.params.id}`;

    pool.query(query, async (err, dbRes) => {
      if (err) {
        console.log(err.stack);
        res.status(401).send({ message: "failed to delete a user", err });
      } else {
        res
          .status(200)
          .send({ message: "Deleted user successfully", result: dbRes.rows });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: error, message: "something went wrong" });
  }
});

app.post("/utils", async (req, res) => {
  try {

    const query =
      "CREATE TABLE USERS( id integer primary key generated always as identity, NAME TEXT NOT NULL, EMAIL TEXT NOT NULL, DEPARTMENT TEXT NOT NULL, FROMDATE TEXT NOT NULL, TODATE TEXT NOT NULL, STATUS TEXT  NOT NULL);"; // Create database with three fields query

    // const query = "DROP TABLE users"; // delete users table

    pool.query(query, async (err, dbRes) => {
      if (err) {
        console.log(err.stack);
        res.status(401).send({ message: "failed to run the query", err });
      } else {
        res.status(200).send({ message: "executed query successfully" });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(401).send({ error:error, message: "something went wrong" });
  }
});
app.get("/:route",(req, res) => {res.status(200).send({ message: "executed query successfully",route:req.params.route});})
app.listen(process.env.PORT || 3000, () => {
  console.log(`app listening at ${process.env.PORT || 3000}`);
});



