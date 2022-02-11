const arr = [1, 5, 8, 14, 25, 37],
    salt = 'uEltUtrV8yCfNqY9ZMFVddwl1JoY058ixjAfAR1';

module.exports.keygen = () => {
    let i,
        key = "",
        characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";

    let charactersLength = characters.length;

    for (i = 0; i < 39; i++) {
        if (!arr.includes(i)) {
            key += characters.charAt(Math.floor(Math.random() * charactersLength + 1));
        } else {
            key += salt.charAt(Math.floor(Math.random() * salt.length + 1));
        }
    }

    return key;
};

module.exports.keyVerify = (key) => {
    return arr.every(e => salt.includes(key[e]))
}
