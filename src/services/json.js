const fs = require("fs");
const path = require("path");

class JsonService {
  constructor() {
    this.dataDir = path.join(__dirname, "..", "..", "data");
    this.ensureDataDirectoryExists();
  }

  ensureDataDirectoryExists() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  generateTimestampedFilename(prefix) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return path.join(this.dataDir, `${prefix}-${timestamp}.json`);
  }

  saveToJson(data, prefix = "data") {
    const filename = this.generateTimestampedFilename(prefix);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    return filename;
  }

  readFromJson(filename) {
    const filePath = path.join(this.dataDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  }
}

module.exports = new JsonService();
