const multer = require("multer")

const express = require("express")
const app = express()

const upload = (multer({ dest: "uploads" }))

app.set("view engine", "ejs")
app.use(express.static(__dirname + '/styles'))

app.get("/", (req, res) => {
    res.render("index")
})

app.post("/upload", upload.single("file"), (req, res) => {
    res.send()
})

app.listen (3000)