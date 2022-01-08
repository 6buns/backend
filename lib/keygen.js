const keygen = () => {
    let i,
        key = "",
        characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";

    let charactersLength = characters.length;

    for (i = 0; i < 39; i++) {
        key += characters.charAt(Math.floor(Math.random() * charactersLength + 1));
    }

    return key;
};

exports.module = keygen
