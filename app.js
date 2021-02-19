require("dotenv").config()

const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
        credentials: true,
    },
    allowEIO3: true,
})
const cors = require("cors")

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

let users = []
let connections = []
let choices = []

io.on("connection", (socket) => {
    console.log("a user connected")
    // disconnect
    socket.on("disconnect", function (data) {
        users.splice(users.indexOf(socket.username), 1)
        updateUsernames()
        connections.splice(connections.indexOf(socket), 1)
        io.emit("disconnected", socket.username)
        console.log("Disconnected: %s sockets connected", connections.length)
    })
    // add user - login
    socket.on("login", function (name) {
        if (users.length >= 2) {
            socket.emit("roomFull")
        } else {
            socket.username = name
            if (users.indexOf(socket.username) > -1) {
                socket.emit("taken", {state: true, name})
            } else {
                users.push(socket.username)
                updateUsernames()
                socket.emit("taken", {state: false, name})
                if (Object.keys(users).length == 2) {
                    io.emit("connected", socket.username)
                    io.emit("game start")
                }
            }
        }
        
    })
    // player choices
    socket.on("player choice", function (username, choice) {
        console.log({username, choice, choices})
        choices.push({ user: username, choice: choice })
        console.log("%s chose %s.", username, choice)
        if (choices.length == 2) {
            console.log("[socket.io] Both players have made choices.")
            switch (choices[0]["choice"]) {
                case "rock":
                    switch (choices[1]["choice"]) {
                        case "rock":
                            io.emit("tie", choices)
                            break
                        case "paper":
                            io.emit("player2Win", choices)
                            break
                        case "scissors":
                            io.emit("player1Win", choices)
                            break
                        default:
                            break
                    }
                    break
                case "paper":
                    switch (choices[1]["choice"]) {
                        case "rock":
                            io.emit("player1Win", choices)
                            break
                        case "paper":
                            io.emit("tie", choices)
                            break
                        case "scissors":
                            io.emit("player2Win", choices)
                            break
                        default:
                            break
                    }
                    break
                case "scissors":
                    switch (choices[1]["choice"]) {
                        case "rock":
                            io.emit("player2Win", choices)
                            break
                        case "paper":
                            io.emit("player1Win", choices)
                            break
                        case "scissors":
                            io.emit("tie", choices)
                            break
                        default:
                            break
                    }
                    break
                default:
                    break
            }
            choices = []
        }
    })
    // function helper
    function updateUsernames() {
        io.sockets.emit("getUser", users)
    }
    //
})

http.listen(3000, () => {
    console.log("listening on *:3000")
})
