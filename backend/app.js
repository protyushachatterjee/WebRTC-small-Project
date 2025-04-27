const express = require("express");
const app = express();
const socketIO = require("socket.io");
const http = require("http");
const server = http.createServer(app)
const io = socketIO(server);
const path = require("path");
const dotenv=require("dotenv");
dotenv.config();
const port = process.env.PORT || 3000;




app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    socket.on("signallingMassage", async (message) => {
        socket.broadcast.emit("signallingMassage", message);
    })
})

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(port, () => {
  console.log("Server is running on port 3000");
});
