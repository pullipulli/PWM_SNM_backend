const crypto = require('crypto');

const hash = (input) => {
    return crypto.createHash('md5')
        .update(input)
        .digest('hex')
}

module.exports = hash;