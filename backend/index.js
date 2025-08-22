const express = require("express");
const kycRouter = require("./routes");
const app = express();

app.use(express.json({ limit: "10mb" }));

app.use("/api", kycRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
