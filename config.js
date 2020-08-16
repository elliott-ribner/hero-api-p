// TODO: this should use a proper config structure

module.exports = {
  mongo: process.env.NODE_ENV === "test" ? "dburl" : "dburl",
  url: "http://localhost:3000/",
};
