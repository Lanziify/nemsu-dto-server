const express = require("express")
const cors = require("cors")
const path = require("path")

require("dotenv").config()

const app = express()
const PORT = process.env.PORT

app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname, "public")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.use("/api/dto/", require("./routes/apiRoutes"))

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`)
})
