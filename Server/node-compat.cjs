const buffer = require("buffer");
const dns = require("dns");

if (!buffer.SlowBuffer) {
    buffer.SlowBuffer = buffer.Buffer;
}

// Fix querySrv ECONNREFUSED on Windows local DNS by using reliable DNS resolvers
try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
    // Ignore if not supported
}

