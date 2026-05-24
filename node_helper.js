/* MagicMirror²
 * Node Helper: MMM-QRCode
 */

const NodeHelper = require("node_helper");
const https = require("https");
const http = require("http");

module.exports = NodeHelper.create({
    fetchText(url, responseField) {
        const client = url.startsWith("https") ? https : http;
        client.get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                if (responseField) {
                    try {
                        const json = JSON.parse(data);
                        const text = json[responseField];
                        if (text === undefined) {
                            this.sendSocketNotification("FETCH_ERROR", { error: `Field '${responseField}' not found in response` });
                            return;
                        }
                        this.sendSocketNotification("TEXT_FETCHED", {
                            text: String(text),
                            expiresAt: json.expiresAt || null
                        });
                    } catch (e) {
                        this.sendSocketNotification("FETCH_ERROR", { error: `JSON parse error: ${e.message}` });
                    }
                } else {
                    this.sendSocketNotification("TEXT_FETCHED", { text: data.trim() });
                }
            });
        }).on("error", (err) => {
            this.sendSocketNotification("FETCH_ERROR", { error: err.message });
        });
    },

    socketNotificationReceived(notification, payload) {
        if (notification === "FETCH_TEXT") {
            this.fetchText(payload.url, payload.responseField);
        }
    }
});
