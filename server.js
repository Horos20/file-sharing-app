require("dotenv").config();
const multer = require("multer")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const File = require("./models/File")

const express = require("express")
const app = express()
app.use(express.urlencoded( {extended: true }))

const upload = (multer({ dest: "uploads" }))

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const cluster = process.env.CLUSTER;
const dbname = process.env.DBNAME;

mongoose.connect(`mongodb+srv://${username}:${password}@${cluster}.tpfx3.mongodb.net/${dbname}?retryWrites=true&w=majority`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("Connected successfully");
});

app.set("view engine", "ejs")
app.use(express.static(__dirname + '/styles'))

app.get("/", (req, res) => {
    res.render("index")
})

app.post("/upload", upload.single("file"), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname
    }
    if (req.body.password != null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }

    const file = await File.create(fileData)
    res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` })
})

app.route("/file/:id").get(handleDownload).post(handleDownload)

async function handleDownload(req, res) {
    let file;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        if (await File.exists({ _id: req.params.id })) {
            file = await File.findById(req.params.id)
        } else {
            res.send("File does not exist")
            return
        }
    } else {
        res.send("Not a valid path")
        return
    }

    if (file.password != null) {
        if (req.body.password == null) {
            res.render("password")
            return
        }
        if (!(await bcrypt.compare(req.body.password, file.password))) {
            res.render("password", { error: true })
            return
        }
    }

    file.downloadCount++
    await file.save()

    res.download(file.path, file.originalName)
}

const PORT = process.env.PORT || 3000
app.listen (PORT)